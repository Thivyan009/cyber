"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createCustomer(
  data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  },
  businessId?: string
) {
  console.log("Creating customer with data:", data);

  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: Please sign in to create a customer");
  }

  let targetBusinessId = businessId;

  // If no businessId is provided, find the first business for user
  if (!targetBusinessId) {
    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    });

    if (!business) {
      throw new Error("Business not found: Complete your business setup first");
    }

    targetBusinessId = business.id;
  }

  try {
    const newCustomer = await prisma.customer.create({
      data: {
        ...data,
        businessId: targetBusinessId,
      },
    });

    console.log("Successfully created customer:", newCustomer);

    // Revalidate invoices and customers-related paths
    revalidatePath("/invoices");
    revalidatePath("/invoices/create");

    return newCustomer;
  } catch (error) {
    console.error("Error creating customer:", error);
    throw new Error("Failed to create customer. Please try again.");
  }
}

export async function getCustomers(businessId?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: Please sign in to view customers");
  }

  let targetBusinessId = businessId;

  // If no businessId is provided, find the first business for user
  if (!targetBusinessId) {
    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    });

    if (!business) {
      // Return empty array instead of throwing error to handle onboarding state gracefully
      console.log("No business found for current user");
      return [];
    }

    targetBusinessId = business.id;
  }

  try {
    const customers = await prisma.customer.findMany({
      where: { businessId: targetBusinessId },
      orderBy: { name: "asc" },
    });

    console.log(
      `Found ${customers.length} customers for business ${targetBusinessId}`
    );

    return customers;
  } catch (error) {
    console.error("Error fetching customers:", error);
    // Return empty array to handle errors gracefully
    return [];
  }
} 