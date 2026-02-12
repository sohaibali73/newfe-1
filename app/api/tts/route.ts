/**
 * Next.js API Route: /api/tts
 * Proxies TTS requests to the backend's edge-tts endpoint.
 */
import { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8000' 
    : 'https://potomac-analyst-workbench-production.up.railway.app');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authToken = req.headers.get('authorization') || '';

    const response = await fetch(`${API_BASE_URL}/chat/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
      },
      body: JSON.stringify({
        text: body.text || '',
        voice: body.voice || 'en-US-AriaNeural',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: `TTS error: ${response.status}` }));
      return new Response(JSON.stringify({ error: error.detail }), { 
        status: response.status, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Stream the audio back
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'TTS failed' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
