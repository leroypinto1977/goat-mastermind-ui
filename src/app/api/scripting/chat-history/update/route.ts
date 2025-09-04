import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_URL = process.env.NEXT_PUBLIC_SCRIPTING_API_URL || "http://15.206.158.83:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${EXTERNAL_API_URL}/chat-history/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

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
    return NextResponse.json(
      { error: 'Failed to update chat' },
      { status: 500 }
    );
  }
}
