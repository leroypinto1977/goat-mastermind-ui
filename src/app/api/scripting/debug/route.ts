import { NextRequest, NextResponse } from "next/server";

const EXTERNAL_API_URL =
  process.env.NEXT_PUBLIC_SCRIPTING_API_URL || "http://15.206.158.83:8000";

export async function GET() {
  try {
    // Test the external API health first
    const healthResponse = await fetch(`${EXTERNAL_API_URL}/health`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const healthData = await healthResponse.json();

    // Test a simple chat request
    let chatStatus = "untested";
    let chatError = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for test

      const chatResponse = await fetch(`${EXTERNAL_API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          message: "test",
          chat_history: [],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (chatResponse.ok) {
        chatStatus = "working";
      } else {
        chatStatus = "error";
        chatError = `HTTP ${chatResponse.status}`;
      }
    } catch (error) {
      chatStatus = "failed";
      chatError = error instanceof Error ? error.message : "Unknown error";
    }

    return NextResponse.json({
      external_api_url: EXTERNAL_API_URL,
      health_check: {
        status: healthResponse.ok ? "ok" : "failed",
        data: healthData,
      },
      chat_endpoint: {
        status: chatStatus,
        error: chatError,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to test external API",
        details: error instanceof Error ? error.message : "Unknown error",
        external_api_url: EXTERNAL_API_URL,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
