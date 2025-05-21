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

    // Check if the user has completed onboarding of their current business
    // First get the currentBusinessId from localStorage cookie if available
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    // Check if the user has any businesses
    const businesses = await prisma.business.findMany({
      where: { userId },
      select: { id: true, onboardingCompleted: true },
    });

    if (businesses.length === 0) {
      // No businesses yet, redirect to onboarding
      return NextResponse.json({ onboardingCompleted: false });
    }

    // If user has businesses but no onboarding for any of them
    const anyBusinessOnboarded = businesses.some((b) => b.onboardingCompleted);
    if (!anyBusinessOnboarded) {
      return NextResponse.json({ onboardingCompleted: false });
    }

    // User has at least one business with completed onboarding
    return NextResponse.json({
      onboardingCompleted: true,
      hasMultipleBusinesses: businesses.length > 1,
    });
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return NextResponse.json(
      { error: "Failed to check onboarding status" },
      { status: 500 }
    );
  }
}
