"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getCurrentBusiness() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const business = await prisma.business.findFirst({
    where: { userId: session.user.id },
  });

  if (!business) {
    return null;
  }

  return business;
}

export async function getBusinesses() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const businesses = await prisma.business.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return businesses;
}

export async function createBusiness(data: {
  name: string;
  type: string;
  industry: string;
  currency: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  console.log("Creating new business for user:", session.user.id);
  console.log("Business data:", data);

  // Check if a business with the same name already exists for this user
  const existingBusiness = await prisma.business.findFirst({
    where: {
      userId: session.user.id,
      name: data.name,
    },
  });

  if (existingBusiness) {
    console.log("Business with same name already exists:", existingBusiness);
    throw new Error("A business with this name already exists");
  }

  // Create new business with a fresh object
  const business = await prisma.business.create({
    data: {
      name: data.name,
      type: data.type,
      industry: data.industry,
      currency: data.currency,
      userId: session.user.id,
    },
  });

  console.log("Successfully created new business:", business);
  return business;
}

export async function updateBusiness(
  id: string,
  data: {
    name?: string;
    type?: string;
    industry?: string;
    currency?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const business = await prisma.business.findUnique({
    where: { id },
  });

  if (!business || business.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  const updatedBusiness = await prisma.business.update({
    where: { id },
    data,
  });

  return updatedBusiness;
}

export async function deleteBusiness(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const business = await prisma.business.findUnique({
    where: { id },
  });

  if (!business || business.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await prisma.business.delete({
    where: { id },
  });

  return { success: true };
}
