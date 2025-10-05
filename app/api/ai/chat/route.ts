import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    console.log("[v0] AI chat endpoint called")

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] User authenticated:", !!user)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, roomId, conversationHistory } = await req.json()

    console.log("[v0] Request data:", { message, roomId, historyLength: conversationHistory?.length })

    if (!message || !roomId) {
      return NextResponse.json({ error: "Message and roomId are required" }, { status: 400 })
    }

    const apiKey = process.env.LLM_API_KEY
    const model = "meta-llama/llama-3.3-70b-instruct:free"

    // Default to OpenRouter API
    const apiUrl = "https://openrouter.ai/api/v1/chat/completions"

    console.log("[v0] API Config:", {
      hasApiKey: !!apiKey,
      apiUrl,
      model,
    })

    if (!apiKey) {
      console.error("[v0] LLM_API_KEY not configured")
      return NextResponse.json(
        { error: "LLM API key not configured. Please add LLM_API_KEY to environment variables." },
        { status: 500 },
      )
    }

    // Prepare conversation history for context
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful AI assistant in a chat room. Be concise, friendly, and helpful. Keep responses brief and conversational.",
      },
      ...(conversationHistory || []).slice(-10).map((msg: any) => ({
        role: msg.user_id === user.id ? "user" : "assistant",
        content: msg.content,
      })),
      {
        role: "user",
        content: message,
      },
    ]

    console.log("[v0] Calling LLM API with model:", model)

    // Call LLM API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Real-time Chat App",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    console.log("[v0] LLM API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] LLM API error:", errorText)
      return NextResponse.json(
        {
          error: "Failed to get AI response",
          details: errorText,
          status: response.status,
        },
        { status: response.status },
      )
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await response.text()
      console.error("[v0] Expected JSON but got:", contentType)
      return NextResponse.json(
        {
          error: "Invalid API response format",
          details: `Expected JSON but got ${contentType}`,
        },
        { status: 500 },
      )
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response."

    console.log("[v0] AI response received successfully")

    let aiMessage = null
    try {
      const { data: savedMessage, error: dbError } = await supabase
        .from("messages")
        .insert({
          room_id: roomId,
          user_id: user.id,
          content: aiResponse,
          type: "text",
        })
        .select()
        .single()

      if (dbError) {
        console.error("[v0] Failed to save AI message:", dbError)
      } else {
        aiMessage = savedMessage
      }
    } catch (dbError) {
      console.error("[v0] Database error (non-fatal):", dbError)
    }

    return NextResponse.json({
      response: aiResponse,
      message: aiMessage || {
        id: `temp-${Date.now()}`,
        room_id: roomId,
        user_id: user.id,
        content: aiResponse,
        type: "text",
        created_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] AI chat error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
