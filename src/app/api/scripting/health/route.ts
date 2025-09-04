import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_URL = process.env.NEXT_PUBLIC_SCRIPTING_API_URL || "http://15.206.158.83:8000";

export async function GET() {
  try {
    const response = await fetch(`${EXTERNAL_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: 'unhealthy', error: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ status: 'healthy', ...data });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { status: 'unhealthy', error: 'Connection failed' },
      { status: 500 }
    );
  }
}
