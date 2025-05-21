import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("Business name API - Start")
    const session = await getServerSession(authOptions)
    console.log("Business name API - Session:", session)

    if (!session?.user?.id) {
      console.log("Business name API - No session")
      return NextResponse.json(
        { error: "Unauthorized" },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      )
    }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
      select: { name: true }
    })
    console.log("Business name API - Found business:", business)

    if (!business) {
      console.log("Business name API - No business found")
      return NextResponse.json(
        { name: null },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      )
    }

    console.log("Business name API - Returning:", business.name)
    return NextResponse.json(
      { name: business.name },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    )
  } catch (error) {
    console.error("Business name API - Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    )
  }
} 