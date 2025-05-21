import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data including business info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        business: {
          select: {
            name: true,
          },
        },
        settings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create settings if they don't exist
    let settings = user.settings;
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          theme: "light",
          emailNotifications: true,
          onboardingCompleted: false,
        },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company || user.business?.name || null,
        role: user.role,
        bio: user.bio,
        image: user.image,
      },
      settings,
    });
  } catch (error) {
    console.error("Get Settings Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, company, role, bio } = body;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        company,
        role,
        bio,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update Settings Error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
