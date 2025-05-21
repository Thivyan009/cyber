import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all businesses connected to this user
    const businesses = await prisma.business.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        name: true,
        industry: true,
        currency: true,
      },
    });

    return NextResponse.json(businesses);
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();

    console.log("Creating new business for user:", userId);
    console.log("Business data:", data);

    // Validate business data
    if (!data.name || !data.industry) {
      return NextResponse.json(
        { error: "Missing required fields: name and industry are required" },
        { status: 400 }
      );
    }

    // Check if a business with the same name already exists for this user
    const existingBusiness = await prisma.business.findFirst({
      where: {
        userId: userId,
        name: data.name,
      },
    });

    if (existingBusiness) {
      console.log("Business with same name already exists:", existingBusiness);
      return NextResponse.json(
        { error: "A business with this name already exists" },
        { status: 409 }
      );
    }

    // Create new business with a fresh object
    const business = await prisma.business.create({
      data: {
        name: data.name,
        industry: data.industry,
        currency: data.currency || "USD",
        userId: userId,
      },
    });

    console.log("Successfully created new business:", business);

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
 
 
 