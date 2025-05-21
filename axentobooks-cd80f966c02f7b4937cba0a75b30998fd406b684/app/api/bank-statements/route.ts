import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Get businessId from query parameter
    const businessId = req.nextUrl.searchParams.get("businessId");

    // Log the start of the request
    console.log(
      "Fetching bank statements - start",
      businessId ? `for business: ${businessId}` : ""
    );

    const session = await auth();
    if (!session?.user?.id) {
      console.log("No authenticated user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Authenticated user ID:", session.user.id);

    // If businessId is provided, verify it belongs to the current user
    let business;
    if (businessId) {
      business = await prisma.business.findUnique({
        where: {
          id: businessId,
          userId: session.user.id,
        },
      });

      if (!business) {
        console.log("Business not found or does not belong to user");
        return NextResponse.json(
          { error: "Business not found or unauthorized" },
          { status: 404 }
        );
      }
    } else {
      // Fallback to getting the first business for the user
      business = await prisma.business.findFirst({
        where: { userId: session.user.id },
      });

      if (!business) {
        console.log("No business found for user:", session.user.id);
        return NextResponse.json(
          { error: "Business not found" },
          { status: 404 }
        );
      }
    }

    console.log("Using business ID:", business.id);

    try {
      const statements = await prisma.bankStatement.findMany({
        where: { businessId: business.id },
        select: {
          id: true,
          fileName: true,
          originalName: true,
          status: true,
          date: true,
          balance: true,
          currency: true,
          accountId: true,
          statementNumber: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      console.log(
        "Successfully fetched statements:",
        statements.length,
        "for business:",
        business.id
      );
      return NextResponse.json(statements);
    } catch (prismaError) {
      console.error("Prisma error while fetching statements:", prismaError);
      throw prismaError; // Re-throw to be caught by outer catch block
    }
  } catch (error) {
    // Log the full error object
    console.error("Failed to fetch bank statements - full error:", error);

    // Return a more detailed error message
    return NextResponse.json(
      {
        error: "Failed to fetch bank statements",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
