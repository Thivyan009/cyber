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
    const { businessId, ...onboardingData } = data;

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    // Verify the business belongs to the user
    const business = await prisma.business.findUnique({
      where: {
        id: businessId,
        userId: userId,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found or not owned by user" },
        { status: 404 }
      );
    }

    // Update the business with onboarding completed
    await prisma.business.update({
      where: {
        id: businessId,
      },
      data: {
        onboardingCompleted: true,
        // Add any other business-specific data from onboarding
        ...onboardingData
      },
    });

    // We keep the user setting as well for backward compatibility
    await prisma.userSettings.upsert({
      where: {
        userId: userId,
      },
      update: {
        onboardingCompleted: true,
      },
      create: {
        userId: userId,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
