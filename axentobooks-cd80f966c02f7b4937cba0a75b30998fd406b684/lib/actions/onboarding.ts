"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { OnboardingData } from "@/lib/types/onboarding";
import { auth } from "../auth";
import type { FormData } from "@/components/onboarding/onboarding-form";
import { revalidatePath } from "next/cache";

export async function saveOnboardingData(
  userId: string,
  data: FormData,
  businessId: string
) {
  try {
    // Verify the business belongs to the user
    const business = await prisma.business.findUnique({
      where: {
        id: businessId,
      },
    });

    if (!business || business.userId !== userId) {
      throw new Error("Business not found or not owned by user");
    }

    // Update business info
    await prisma.business.update({
      where: { id: businessId },
      data: {
        name: data.businessInfo.name || business.name,
        industry: data.businessInfo.industry || business.industry,
        registrationNo: data.businessInfo.registrationNumber,
        taxId: data.businessInfo.taxId,
      },
    });

    // Clear existing financial goals if any and create new ones
    if (data.financialGoals.length > 0) {
      await prisma.financialGoal.deleteMany({
        where: { businessId },
      });

      await prisma.financialGoal.createMany({
        data: data.financialGoals.map((goal) => ({
          title: goal.title || "Untitled Goal",
          targetAmount: goal.targetAmount || 0,
          currentAmount: goal.currentAmount || 0,
          deadline: goal.deadline || new Date(),
          businessId,
        })),
      });
    }

    // Handle assets
    if (data.assets.length > 0) {
      await prisma.asset.deleteMany({
        where: { businessId },
      });

      // Filter out assets with missing required fields and provide defaults
      const validAssets = data.assets
        .filter((asset) => asset && asset.description) // Changed to only look for description
        .map((asset) => ({
          name: asset.description || "Untitled Asset", // Map description to name for DB compatibility
          type: asset.type || "other",
          value: typeof asset.value === "number" ? asset.value : 0,
          purchaseDate: asset.purchaseDate,
          businessId,
        }));

      if (validAssets.length > 0) {
        await prisma.asset.createMany({
          data: validAssets,
        });
      }
    }

    // Handle liabilities
    if (data.liabilities.length > 0) {
      await prisma.liability.deleteMany({
        where: { businessId },
      });

      // Filter out liabilities with missing required fields and provide defaults
      const validLiabilities = data.liabilities
        .filter((liability) => liability && liability.name)
        .map((liability) => ({
          name: liability.name || "Untitled Liability",
          type: liability.type || "other",
          amount: typeof liability.amount === "number" ? liability.amount : 0,
          dueDate: liability.dueDate,
          businessId,
        }));

      if (validLiabilities.length > 0) {
        await prisma.liability.createMany({
          data: validLiabilities,
        });
      }
    }

    // Handle equity
    if (data.equity.length > 0) {
      await prisma.equityDetail.deleteMany({
        where: { businessId },
      });

      // Filter out equity entries with missing required fields and provide defaults
      const validEquity = data.equity
        .filter((equity) => equity && equity.type)
        .map((equity) => ({
          type: equity.type || "OWNER_EQUITY",
          amount: typeof equity.amount === "number" ? equity.amount : 0,
          description: equity.description || "",
          businessId,
        }));

      if (validEquity.length > 0) {
        await prisma.equityDetail.createMany({
          data: validEquity,
        });
      }
    }

    // Update the financial position based on the entered data
    await updateFinancialPosition(businessId, data);

    return { success: true };
  } catch (error) {
    // Safe error logging that handles null errors
    console.error(
      "Error saving onboarding data:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new Error(
      error instanceof Error ? error.message : "Failed to save onboarding data"
    );
  }
}

// Function to update the financial position based on onboarding data
async function updateFinancialPosition(businessId: string, data: FormData) {
  try {
    // Map onboarding asset types to financial position categories
    const isCurrentAsset = (type: string) => {
      // Cash and liquid assets are current assets
      return [
        "cash",
        "bank_accounts",
        "accounts_receivable",
        "inventory",
      ].includes(type.toLowerCase());
    };

    const isCurrentLiability = (type: string) => {
      // Short-term obligations are current liabilities
      return ["credit_cards", "accounts_payable", "other"].includes(
        type.toLowerCase()
      );
    };

    // Calculate totals with the proper type mapping
    const currentAssets = data.assets
      .filter((asset) => isCurrentAsset(asset.type || ""))
      .reduce(
        (sum, asset) =>
          sum + (typeof asset.value === "number" ? asset.value : 0),
        0
      );

    const fixedAssets = data.assets
      .filter((asset) => !isCurrentAsset(asset.type || ""))
      .reduce(
        (sum, asset) =>
          sum + (typeof asset.value === "number" ? asset.value : 0),
        0
      );

    const currentLiabilities = data.liabilities
      .filter((liability) => isCurrentLiability(liability.type || ""))
      .reduce(
        (sum, liability) =>
          sum + (typeof liability.amount === "number" ? liability.amount : 0),
        0
      );

    const longTermLiabilities = data.liabilities
      .filter((liability) => !isCurrentLiability(liability.type || ""))
      .reduce(
        (sum, liability) =>
          sum + (typeof liability.amount === "number" ? liability.amount : 0),
        0
      );

    const commonStock = data.equity
      .filter(
        (equity) =>
          equity.type === "COMMON_STOCK" ||
          equity.type === "common_stock" ||
          equity.type === "investment"
      )
      .reduce(
        (sum, equity) =>
          sum + (typeof equity.amount === "number" ? equity.amount : 0),
        0
      );

    const retainedEarnings = data.equity
      .filter(
        (equity) =>
          equity.type === "RETAINED_EARNINGS" ||
          equity.type === "retained_earnings" ||
          equity.type === "accumulated_profit"
      )
      .reduce(
        (sum, equity) =>
          sum + (typeof equity.amount === "number" ? equity.amount : 0),
        0
      );

    // Calculate total assets, liabilities, and equity
    const totalAssets = currentAssets + fixedAssets;
    const totalLiabilities = currentLiabilities + longTermLiabilities;

    // Calculate total equity by summing all equity entries
    // (not just the specific types we filtered above)
    const totalEquity = data.equity.reduce(
      (sum, equity) =>
        sum + (typeof equity.amount === "number" ? equity.amount : 0),
      0
    );

    const netWorth = totalAssets - totalLiabilities;

    console.log("Updating financial position with:", {
      businessId,
      currentAssets,
      fixedAssets,
      totalAssets,
      currentLiabilities,
      longTermLiabilities,
      totalLiabilities,
      commonStock,
      retainedEarnings,
      totalEquity,
      netWorth,
    });

    // Update or create financial position
    await prisma.financialPosition.upsert({
      where: { businessId },
      update: {
        currentAssets,
        fixedAssets,
        currentLiabilities,
        longTermLiabilities,
        commonStock,
        retainedEarnings,
        totalAssets,
        totalLiabilities,
        totalEquity,
        netWorth,
      },
      create: {
        businessId,
        currentAssets,
        fixedAssets,
        currentLiabilities,
        longTermLiabilities,
        commonStock,
        retainedEarnings,
        totalAssets,
        totalLiabilities,
        totalEquity,
        netWorth,
      },
    });

    console.log("Financial position updated for business:", businessId);
  } catch (error) {
    console.error(
      "Failed to update financial position:",
      error instanceof Error ? error.message : "Unknown error"
    );
    // Don't throw - we want the rest of the onboarding to succeed even if this fails
  }
}

export async function completeOnboardingAction(userId: string) {
  try {
    console.log("Starting onboarding completion for user:", userId);

    if (!userId) {
      console.error("No userId provided");
      throw new Error("UserId is required");
    }

    // Use upsert to handle both creation and update cases
    const result = await prisma.userSettings.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        onboardingCompleted: true,
        theme: "light",
        emailNotifications: true,
      },
      update: {
        onboardingCompleted: true,
      },
    });

    console.log("User settings updated successfully:", result);

    // Redirect to dashboard
    redirect("/dashboard");
  } catch (error) {
    console.error("Detailed onboarding error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      userId,
    });
    throw error; // Throw the original error to preserve the stack trace
  }
}

export async function resetOnboardingAction(userId: string) {
  try {
    // Reset onboarding status
    await prisma.userSettings.update({
      where: { userId },
      data: {
        onboardingCompleted: false,
      },
    });

    // Redirect to onboarding
    redirect("/onboarding/controller");
  } catch (error) {
    console.error(
      "Failed to reset onboarding:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new Error("Failed to reset onboarding");
  }
}

export async function resetAndRedirectAction() {
  "use server";

  try {
    // Get current user settings
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Reset onboarding status
    await prisma.userSettings.update({
      where: { userId: session.user.id },
      data: {
        onboardingCompleted: false,
      },
    });

    // Redirect to onboarding
    redirect("/onboarding/controller");
  } catch (error) {
    console.error(
      "Failed to reset and redirect:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new Error("Failed to reset and redirect to onboarding");
  }
}
