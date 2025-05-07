import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const reports = await prisma.report.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        vulnerabilitiesList: true
      }
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const report = await prisma.report.create({
      data: body
    })
    
    return NextResponse.json({ 
      message: 'Report created successfully',
      id: report.id
    })
  } catch (error) {
    console.error('Report creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    )
  }
} 