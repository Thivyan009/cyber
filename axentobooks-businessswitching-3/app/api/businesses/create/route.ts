import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.industry || !data.currency) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new business
    const business = await prisma.business.create({
      data: {
        name: data.name,
        industry: data.industry,
        registrationNo: data.registrationNo,
        taxId: data.taxId,
        currency: data.currency,
        userId: userId,
      },
    });

    // Initialize financial position with zeros
    await prisma.financialPosition.create({
      data: {
        businessId: business.id,
        currentAssets: 0,
        fixedAssets: 0,
        currentLiabilities: 0,
        longTermLiabilities: 0,
        commonStock: 0,
        retainedEarnings: 0,
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        netWorth: 0,
      },
    });

    return NextResponse.json(business);
  } catch (error) {
    console.error("Error creating business:", error);
    return NextResponse.json(
      { error: "Failed to create business" },
      { status: 500 }
    );
  }
}
 
 
 