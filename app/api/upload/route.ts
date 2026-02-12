/**
 * Next.js API Route: /api/upload
 * 
 * Proxies file upload requests to the backend.
 * Properly reconstructs FormData for the backend fetch.
 */

import { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8000' 
    : 'https://potomac-analyst-workbench-production.up.railway.app');

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get conversation ID from query params
    const conversationId = req.nextUrl.searchParams.get('conversationId');
    
    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get auth token
    const authToken = req.headers.get('authorization') || '';

    // Validate request content-length to prevent oversized uploads
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 52428800) { // 50MB
      return new Response(
        JSON.stringify({ error: 'File is too large (max 50MB)' }), 
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the raw form data from the request
    let incomingFormData;
    try {
      incomingFormData = await req.formData();
    } catch (err) {
      console.error('[v0] FormData parse error:', err);
      return new Response(
        JSON.stringify({ error: 'Failed to parse request data' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const file = incomingFormData.get('file') || incomingFormData.get('audio');
    
    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'No file provided or invalid file format' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[v0] Processing upload: ${file.name} (${file.size} bytes, ${file.type})`);

    // Handle audio transcription for SpeechInput fallback
    if (file.type.startsWith('audio/')) {
      try {
        // Reconstruct FormData for transcription endpoint
        const transcribeFormData = new FormData();
        transcribeFormData.append('audio', file, file.name);

        const transcribeResponse = await fetch(
          `${API_BASE_URL}/chat/conversations/${conversationId}/transcribe`,
          {
            method: 'POST',
            headers: {
              'Authorization': authToken,
            },
            body: transcribeFormData,
          }
        );

        if (transcribeResponse.ok) {
          const transcribeData = await transcribeResponse.json();
          return new Response(JSON.stringify({
            transcript: transcribeData.transcript || transcribeData.text || '',
            success: true,
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } else {
          // Fallback: return empty transcript if transcription fails
          return new Response(JSON.stringify({
            transcript: '',
            success: false,
            error: 'Transcription service unavailable',
          }), {
            status: 200, // Return 200 so SpeechInput doesn't error
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch {
        return new Response(JSON.stringify({
          transcript: '',
          success: false,
          error: 'Transcription failed',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Regular file upload (documents, images, etc.)
    const backendFormData = new FormData();
    backendFormData.append('file', file, file.name);

    const backendResponse = await fetch(
      `${API_BASE_URL}/chat/conversations/${conversationId}/upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': authToken,
          // Don't set Content-Type — let fetch set it with boundary automatically
        },
        body: backendFormData,
      }
    );

    if (!backendResponse.ok) {
      let errorDetail = `Upload failed with status ${backendResponse.status}`;
      try {
        const errorBody = await backendResponse.json();
        errorDetail = errorBody.detail || errorBody.error || errorDetail;
      } catch {
        // Response may not be JSON
        try {
          errorDetail = await backendResponse.text();
        } catch {}
      }
      
      const duration = Date.now() - startTime;
      console.error(`[v0] Upload proxy error (${duration}ms): ${backendResponse.status} - ${errorDetail}`);
      
      return new Response(
        JSON.stringify({ 
          error: errorDetail,
          status: backendResponse.status,
          file: file.name
        }), 
        { status: backendResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await backendResponse.json();
    const duration = Date.now() - startTime;
    console.log(`[v0] Upload successful (${duration}ms): ${file.name}`);

    // If backend auto-registered a .pptx as template, include that info
    // so the frontend can show a toast about it
    if (data.is_template && data.template_id) {
      data.message = `📎 Uploaded ${file.name} — also registered as presentation template (${data.template_layouts} layouts). Say "use my template" when creating presentations.`;
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Upload API route error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Upload failed' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
