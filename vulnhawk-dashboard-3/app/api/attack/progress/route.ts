import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    // Get the most recent running attack
    const report = await prisma.report.findFirst({
      where: {
        status: "running",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        vulnerabilitiesList: true
      }
    })

    if (!report) {
      return NextResponse.json({
        status: "idle",
        progress: 0,
      })
    }

    // Calculate progress based on findings
    const findings = report.vulnerabilitiesList.length
    let progress = findings > 0 ? Math.min(Math.round((findings / 10) * 100), 99) : 0

    // If we have findings but status is still running, set progress to 99%
    if (findings > 0 && report.status === "running") {
      progress = 99
    }

    return NextResponse.json({
      status: report.status,
      progress,
      currentModule: "Scanning...",
      reportId: report.id,
      findings
    })
  } catch (error) {
    console.error("Error fetching attack progress:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch attack progress",
      },
      { status: 500 }
    )
  }
} 