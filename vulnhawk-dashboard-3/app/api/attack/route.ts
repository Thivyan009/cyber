import { NextResponse } from 'next/server'
import { startAttack, getAttackProgress } from '@/lib/services/attack'

export async function POST(request: Request) {
  try {
    const { target, modules, scope } = await request.json()

    if (!target || !modules || !Array.isArray(modules) || modules.length === 0) {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      )
    }

    const report = await startAttack(target, modules)
    return NextResponse.json(report)
  } catch (error) {
    console.error("Error in attack API:", error)
    return NextResponse.json(
      { error: "Failed to start attack" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      )
    }

    const progress = await getAttackProgress(reportId)
    return NextResponse.json(progress)
  } catch (error) {
    console.error('Progress fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
} 