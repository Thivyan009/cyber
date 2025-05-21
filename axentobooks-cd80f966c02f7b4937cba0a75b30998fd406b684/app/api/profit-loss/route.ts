import { GoogleGenerativeAI } from "@google/generative-ai"
import type { NextRequest } from "next/server"
import { z } from "zod"

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured in environment variables")
}
const genAI = new GoogleGenerativeAI(apiKey)

// Define types for the AI response
interface PLItem {
  description: string
  amount: number
}

interface PLCategory {
  category: string
  amount: number
  items: PLItem[]
}

interface PLSummary {
  totalRevenue: number
  totalExpenses: number
  netProfitLoss: number
  profitMargin: number
  monthOverMonthGrowth: number
}

interface PLAnalysis {
  insights: string[]
  recommendations: string[]
  riskFactors: string[]
  opportunities: string[]
}

interface PLResponse {
  revenue: PLCategory[]
  expenses: PLCategory[]
  summary: PLSummary
  analysis?: PLAnalysis
}

// Validation schema for request
const requestSchema = z.object({
  transactions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(["expense", "income"]),
      amount: z.number(),
      category: z.string(),
      date: z.string(),
    }),
  ).min(1, "At least one transaction is required"),
  startDate: z.string(),
  endDate: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    
    // Validate request data
    const validationResult = requestSchema.safeParse(json)
    if (!validationResult.success) {
      return Response.json({ 
        error: validationResult.error.errors[0].message 
      }, { status: 400 })
    }
    
    const { transactions, startDate, endDate } = validationResult.data

    // Additional validation for transactions
    if (!transactions || transactions.length === 0) {
      return Response.json({ 
        error: "No transactions provided for P&L statement generation" 
      }, { status: 400 })
    }

    // Create the model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    })

    // Prepare transaction data for analysis
    const transactionSummary = transactions
      .map(
        (t) => `
      Transaction:
      - Description: ${t.name}
      - Type: ${t.type}
      - Amount: $${t.amount.toFixed(2)}
      - Category: ${t.category}
      - Date: ${new Date(t.date).toLocaleDateString()}
    `,
      )
      .join("\n")

    // Create detailed prompt for the AI
    const prompt = `
      Act as an expert financial analyst. Analyze these transactions and generate a detailed profit and loss statement.
      
      Time Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}

      ${transactionSummary}

      Generate a comprehensive financial analysis including:
      1. Revenue breakdown by category
      2. Expense breakdown by category
      3. Detailed financial metrics
      4. Business insights and trends
      5. Strategic recommendations
      6. Risk assessment
      7. Growth opportunities

      Provide the analysis in this JSON format:
      {
        "periodStart": "date",
        "periodEnd": "date",
        "revenue": [
          {
            "category": "string",
            "amount": number,
            "items": [
              {
                "description": "string",
                "amount": number
              }
            ]
          }
        ],
        "expenses": [
          {
            "category": "string",
            "amount": number,
            "items": [
              {
                "description": "string",
                "amount": number
              }
            ]
          }
        ],
        "summary": {
          "totalRevenue": number,
          "totalExpenses": number,
          "netProfitLoss": number,
          "profitMargin": number,
          "monthOverMonthGrowth": number
        },
        "analysis": {
          "insights": ["string"],
          "recommendations": ["string"],
          "riskFactors": ["string"],
          "opportunities": ["string"]
        }
      }

      Important:
      - Categorize similar transactions together
      - Calculate accurate totals and percentages
      - Provide actionable insights
      - Identify specific growth opportunities
      - Highlight potential risks
      - Focus on business impact
    `

    // Generate content using Gemini AI
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    console.log("Raw AI response:", text)

    // Clean up the response text
    const cleanedText = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/^\s*\[?\s*\{/, '{') // Remove any leading array brackets or whitespace
      .replace(/\}\s*\]?\s*$/, '}') // Remove any trailing array brackets or whitespace
      .trim()

    console.log("Cleaned text:", cleanedText)

    // Extract and parse JSON response
    let parsedResponse: PLResponse
    try {
      // Try to find JSON object in the text if it's wrapped in other content
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        parsedResponse = JSON.parse(cleanedText)
      }
      console.log("Successfully parsed response:", parsedResponse)
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError)
      console.error("Failed to parse text:", cleanedText)
      // Try to provide more helpful error message
      if (cleanedText.includes("```")) {
        throw new Error("AI response contains markdown code blocks. Please try again.")
      }
      if (!cleanedText.includes("{")) {
        throw new Error("AI response is not in JSON format. Please try again.")
      }
      throw new Error("Failed to parse AI response. Please try again.")
    }

    // Validate the parsed response
    if (!parsedResponse.revenue || !parsedResponse.expenses || !parsedResponse.summary) {
      throw new Error("Invalid response structure from AI")
    }

    // Add period information
    const finalResponse = {
      ...parsedResponse,
      periodStart: startDate,
      periodEnd: endDate,
    }

    return Response.json(finalResponse)
  } catch (error) {
    console.error("P&L Generation Error:", error)
    if (error instanceof Error) {
      console.error("Error details:", error.message)
      console.error("Error stack:", error.stack)
    }
    return Response.json({ 
      error: error instanceof Error ? error.message : "Failed to generate profit/loss statement" 
    }, { status: 500 })
  }
}

