import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received registration request:", {
      ...body,
      password: "[REDACTED]",
    });

    const validation = RegisterSchema.safeParse(body);
    if (!validation.success) {
      console.log("Validation failed:", validation.error.errors);
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;
    // Default values for business since they'll be set during onboarding
    const defaultBusinessName = "My Business";
    const defaultCurrency = "USD";

    // Check for existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log("User already exists:", email);
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Create user and business
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // Create user first
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          settings: {
            create: {
              theme: "light",
              emailNotifications: true,
              onboardingCompleted: false,
            },
          },
        },
      });
      console.log("User created successfully:", user.id);

      // Then create business with the user's ID
      const business = await prisma.business.create({
        data: {
          name: defaultBusinessName,
          industry: "Other",
          currency: defaultCurrency,
          userId: user.id,
          onboardingCompleted: false,
        },
      });
      console.log("Business created successfully:", business.id);

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
      console.log("Financial position initialized for business:", business.id);

      return NextResponse.json(
        {
          success: true,
          message: "Registration successful",
          isNewUser: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            businessName: business.name,
          },
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }
  } catch (error) {
    console.error("Registration error:", error);

    // Return more specific error messages in development
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(
        {
          error: "Registration failed",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to register user. Please try again later.",
      },
      { status: 500 }
    );
  }
}
