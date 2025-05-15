import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Get the last user message
    const lastMessage = messages[messages.length - 1].content

    // Create a system prompt that defines the assistant's role
    const systemPrompt = `
      You are Uzhavan.ai, an AI farming assistant designed to help smallholder farmers in India.
      Provide simple, practical advice about farming, weather, crop management, and market prices.
      Be respectful and helpful. When appropriate, include some Tamil phrases to make farmers feel comfortable.
      Keep responses concise and actionable.
    `

    // Generate a response using the AI SDK
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: lastMessage,
    })

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
