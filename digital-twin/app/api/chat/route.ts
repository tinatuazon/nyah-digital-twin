import { NextRequest, NextResponse } from "next/server";

// This endpoint will communicate with your MCP server
export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // For now, we'll use the existing digital twin logic
    // Later, you can modify this to call your separate MCP server
    const { enhancedDigitalTwinQuery } = await import("@/app/actions/digital-twin-actions");
    
    const result = await enhancedDigitalTwinQuery(question);
    
    if (!result.success) {
      throw new Error(result.error || "Failed to get response");
    }

    return NextResponse.json({
      success: true,
      response: result.response,
      metadata: result.metadata,
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process question",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for testing
export async function GET() {
  return NextResponse.json({
    message: "Chat API is working",
    usage: "POST a JSON object with 'question' field to get AI response",
    example: {
      question: "What are Nyah's technical skills?"
    }
  });
}