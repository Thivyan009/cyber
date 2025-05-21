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

    if (!data.businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    // Find the business and verify ownership
    const business = await prisma.business.findUnique({
      where: {
        id: data.businessId,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    if (business.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to update this business" },
        { status: 403 }
      );
    }

    // Check if name is being changed and if it conflicts with existing business
    if (data.name && data.name !== business.name) {
      const existingBusiness = await prisma.business.findFirst({
        where: {
          userId: userId,
          name: data.name,
          id: { not: data.businessId }, // Exclude current business
        },
      });

      if (existingBusiness) {
        return NextResponse.json(
          { error: "A business with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Update the business
    const updatedBusiness = await prisma.business.update({
      where: {
        id: data.businessId,
      },
      data: {
        name: data.name,
        industry: data.industry,
        registrationNo: data.registrationNo,
        taxId: data.taxId,
        currency: data.currency,
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
 
 