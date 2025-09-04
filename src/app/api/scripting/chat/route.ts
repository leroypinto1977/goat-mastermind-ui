import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_URL = process.env.NEXT_PUBLIC_SCRIPTING_API_URL || "http://15.206.158.83:8000";
const TIMEOUT_MS = 15000; // Reduced to 15 seconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, TIMEOUT_MS);

    const response = await fetch(`${EXTERNAL_API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API Error:', response.status, errorText);
      return NextResponse.json(
        { error: `External API Error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy API Error:', error);
    
    // Check if it's a timeout error
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
      return NextResponse.json(
        { error: 'Request timeout - the AI service is taking too long to respond' },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to communicate with scripting service' },
      { status: 500 }
    );
  }
}
