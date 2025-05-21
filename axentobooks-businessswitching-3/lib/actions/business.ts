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

  const business = await prisma.business.create({
    data: {
      ...data,
      userId: session.user.id,
    },
  });

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
