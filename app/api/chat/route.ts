/**
 * Next.js API Route: /api/chat
 * 
 * Translates between Vercel AI SDK v5 UI Message Stream Protocol (SSE)
 * and the backend's old Data Stream Protocol (0:, 2:, d: format).
 */

import { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8000' 
    : 'https://potomac-analyst-workbench-production.up.railway.app');

// UI Message Stream headers required by AI SDK v5
const UI_MESSAGE_STREAM_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'x-vercel-ai-ui-message-stream': 'v1',
};

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages || [];
    const data = body.data || {};
    
    // Get the latest user message
    const lastUserMessage = messages
      .filter((m: any) => m.role === 'user')
      .pop();
    
    if (!lastUserMessage) {
      return new Response(
        JSON.stringify({ error: 'No user message found' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract text content from parts-based or content-based message
    // AI SDK v5 sends messages with `parts` array, but also may have `content`
    let messageText = '';
    if (lastUserMessage.parts && Array.isArray(lastUserMessage.parts)) {
      messageText = lastUserMessage.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text || '')
        .join('');
    }
    // Fallback to content/text fields
    if (!messageText) {
      messageText = lastUserMessage.content || lastUserMessage.text || '';
    }
    
    // Check if this is a document generation request
    const isDocumentRequest = /\b(write|create|generate|write|draft|compose)\s+\w+\s+(document|proposal|report|memo|letter|contract|policy|guide|manual|plan|summary|brief|outline|template|form|checklist)/i.test(messageText) ||
                              /\b(document|proposal|report|memo|letter|contract|policy|guide|manual|plan|summary|brief|outline|template|form|checklist)\b/i.test(messageText);
    
    if (!messageText.trim()) {
      return new Response(
        JSON.stringify({ error: 'Empty message content' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const authToken = req.headers.get('authorization') || '';
    // conversationId comes from:
    // 1. sendMessage options body (request-level, merged at top level by DefaultChatTransport)
    // 2. transport-level body() callback (also merged at top level)
    // NOTE: body.id is the SDK's internal chat ID, NOT our conversationId - do NOT use it
    const conversationId = body.conversationId || data.conversationId || null;

    // Forward to backend streaming endpoint
    const backendResponse = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
      },
      body: JSON.stringify({
        content: messageText,
        conversation_id: conversationId,
      }),
    });

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({ 
        detail: `Backend error: ${backendResponse.status}` 
      }));
      return new Response(
        JSON.stringify({ error: error.detail || `HTTP ${backendResponse.status}` }), 
        { status: backendResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newConversationId = backendResponse.headers.get('X-Conversation-Id');

    // Create a TransformStream to translate old protocol → UI Message Stream SSE
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Write SSE formatted event
    const writeSSE = async (data: any) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    // Process the backend stream in the background
    (async () => {
      try {
        if (!backendResponse.body) {
          await writeSSE({ type: 'start', messageId: `msg-${Date.now()}` });
          await writeSSE({ type: 'text-start', id: `text-${Date.now()}` });
          await writeSSE({ type: 'text-delta', id: `text-${Date.now()}`, delta: 'Error: No response stream from backend' });
          await writeSSE({ type: 'text-end', id: `text-${Date.now()}` });
          await writeSSE({ type: 'finish' });
          await writer.write(encoder.encode('data: [DONE]\n\n'));
          await writer.close();
          return;
        }
        const reader = backendResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let messageId = `msg-${Date.now()}`;
        let textId = `text-${Date.now()}`;
        let textStarted = false;
        let accumulatedText = '';
        // Track which tool calls have had their input-start sent (prevents double start)
        const toolInputStartedSet = new Set<string>();

        // Send message start
        await writeSSE({ type: 'start', messageId });
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            const typeCode = line[0];
            const content = line.substring(2);
            if (!content) continue;

            // Debug: log what backend sends
            console.log(`[API/chat] Backend type=${typeCode}, content=${content.substring(0, 100)}`);

            try {
              const parsed = JSON.parse(content);

              switch (typeCode) {
                case '0': // Text delta
                  const text = typeof parsed === 'string' ? parsed : parsed.text || '';
                  if (text) {
                    if (!textStarted) {
                      await writeSSE({ type: 'text-start', id: textId });
                      textStarted = true;
                    }
                    await writeSSE({ type: 'text-delta', id: textId, delta: text });
                    accumulatedText += text;
                  }
                  break;

                case '2': // Data (artifacts, custom data)
                  // End text if we were in a text block
                  if (textStarted) {
                    await writeSSE({ type: 'text-end', id: textId });
                    textStarted = false;
                    textId = `text-${Date.now()}`; // New ID for next text block
                  }
                  // Send as custom data part
                  if (Array.isArray(parsed)) {
                    for (const item of parsed) {
                      if (item && item.type === 'artifact') {
                        await writeSSE({
                          type: `data-artifact`,
                          id: item.id || `artifact-${Date.now()}`,
                          data: item,
                        });
                      } else if (item && item.conversation_id) {
                        // Conversation metadata
                        await writeSSE({
                          type: 'data-conversation',
                          data: item,
                        });
                      }
                    }
                  } else if (parsed && typeof parsed === 'object') {
                    if (parsed.conversation_id) {
                      await writeSSE({
                        type: 'data-conversation', 
                        data: parsed,
                      });
                    }
                  }
                  break;

                case '3': // Error
                  await writeSSE({
                    type: 'error',
                    errorText: typeof parsed === 'string' ? parsed : parsed.message || 'Unknown error',
                  });
                  break;

                case '7': // Tool call streaming start
                  if (parsed.toolCallId && parsed.toolName) {
                    // End any open text block before tool starts
                    if (textStarted) {
                      await writeSSE({ type: 'text-end', id: textId });
                      textStarted = false;
                      textId = `text-${Date.now()}`;
                    }
                    // Only send tool-input-start once per toolCallId
                    if (!toolInputStartedSet.has(parsed.toolCallId)) {
                      toolInputStartedSet.add(parsed.toolCallId);
                      await writeSSE({
                        type: 'tool-input-start',
                        toolCallId: parsed.toolCallId,
                        toolName: parsed.toolName,
                      });
                    }
                  }
                  break;

                case '8': // Tool call argument delta
                  if (parsed.toolCallId && parsed.argsTextDelta) {
                    await writeSSE({
                      type: 'tool-input-delta',
                      toolCallId: parsed.toolCallId,
                      inputTextDelta: parsed.argsTextDelta,
                    });
                  }
                  break;

                case '9': // Complete tool call (input available)
                  if (parsed.toolCallId && parsed.toolName) {
                    // End any open text block before tool
                    if (textStarted) {
                      await writeSSE({ type: 'text-end', id: textId });
                      textStarted = false;
                      textId = `text-${Date.now()}`;
                    }
                    // Only send tool-input-start if not already sent (e.g., via type 7)
                    if (!toolInputStartedSet.has(parsed.toolCallId)) {
                      toolInputStartedSet.add(parsed.toolCallId);
                      await writeSSE({
                        type: 'tool-input-start',
                        toolCallId: parsed.toolCallId,
                        toolName: parsed.toolName,
                      });
                    }
                    // Send tool-input-available with the complete input
                    await writeSSE({
                      type: 'tool-input-available',
                      toolCallId: parsed.toolCallId,
                      toolName: parsed.toolName,
                      input: parsed.args || {},
                    });
                  }
                  break;

                case 'a': // Tool result (output available)
                  if (parsed.toolCallId) {
                    let output = parsed.result;
                    if (typeof output === 'string') {
                      try { output = JSON.parse(output); } catch {}
                    }
                    await writeSSE({
                      type: 'tool-output-available',
                      toolCallId: parsed.toolCallId,
                      output: output,
                    });
                  }
                  break;

                case 'd': // Finish message
                  // End any open text block
                  if (textStarted) {
                    await writeSSE({ type: 'text-end', id: textId });
                    textStarted = false;
                  }
                  await writeSSE({ type: 'finish' });
                  break;

                case 'e': // Finish step
                  await writeSSE({ type: 'finish-step' });
                  break;

                case 'f': // Start step
                  await writeSSE({ type: 'start-step' });
                  break;
              }
            } catch (parseError) {
              // Skip unparseable lines
            }
          }
        }

        // Ensure text is closed
        if (textStarted) {
          await writeSSE({ type: 'text-end', id: textId });
        }

        // Ensure finish is sent
        await writeSSE({ type: 'finish' });
        
        // Send done marker
        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        try {
          await writeSSE({ type: 'error', errorText: err instanceof Error ? err.message : 'Stream error' });
          await writer.write(encoder.encode('data: [DONE]\n\n'));
        } catch {}
      } finally {
        try { await writer.close(); } catch {}
      }
    })();

    const headers: Record<string, string> = { ...UI_MESSAGE_STREAM_HEADERS };
    if (newConversationId) {
      headers['X-Conversation-Id'] = newConversationId;
    }

    return new Response(readable, { status: 200, headers });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
