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
    
    // Validate the business ID is provided
    if (!data.businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }
    
    // Verify the business belongs to the user
    const business = await prisma.business.findFirst({
      where: {
        id: data.businessId,
        userId: userId,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found or not owned by user" },
        { status: 404 }
      );
    }
    
    // Remove businessId from the data as it's not a column to update
    const { businessId, ...updateData } = data;
    
    // Update the business information
    const updatedBusiness = await prisma.business.update({
      where: {
        id: businessId,
      },
      data: {
        ...updateData,
        updatedAt: new Date(),
        onboardingCompleted: true, // Mark as onboarded
      },
    });
    
    // Also update user settings for backward compatibility
    await prisma.userSettings.upsert({
      where: {
        userId,
      },
      update: {
        onboardingCompleted: true,
      },
      create: {
        userId,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json(updatedBusiness);
  } catch (error) {
    console.error("Error updating business:", error);
    return NextResponse.json(
      { error: "Failed to update business" },
      { status: 500 }
    );
  }
} 
 
 