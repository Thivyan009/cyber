"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getNotifications(userId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: 50, // Limit to last 50 notifications
    })

    return { notifications }
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    return { error: "Failed to fetch notifications" }
  }
}

export async function markAsRead(userId: string, notificationId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId,
      },
      data: { read: true },
    })

    revalidatePath("/")
    return { notification }
  } catch (error) {
    console.error("Failed to mark notification as read:", error)
    return { error: "Failed to mark notification as read" }
  }
}

export async function markAllAsRead(userId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error)
    return { error: "Failed to mark all notifications as read" }
  }
}

export async function clearNotification(userId: string, notificationId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId,
      },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to clear notification:", error)
    return { error: "Failed to clear notification" }
  }
}

export async function addNotification(userId: string, data: {
  title: string
  message: string
  type: "transaction" | "system" | "alert"
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title: data.title,
        message: data.message,
        type: data.type,
      },
    })

    revalidatePath("/")
    return { notification }
  } catch (error) {
    console.error("Failed to add notification:", error)
    return { error: "Failed to add notification" }
  }
} 