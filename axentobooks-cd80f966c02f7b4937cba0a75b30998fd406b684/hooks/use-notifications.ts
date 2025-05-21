"use client"

import { useState, useCallback, useEffect } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import type { Notification } from "@/lib/types/notification"
import {
  getNotifications,
  markAsRead,
  markAllAsRead as markAllAsReadAction,
  clearNotification as clearNotificationAction,
  addNotification as addNotificationAction,
} from "@/lib/actions/notifications"

export function useNotifications() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  // Load notifications on mount and when session changes
  useEffect(() => {
    async function loadNotifications() {
      if (session?.user?.id) {
        try {
          const { notifications: data, error } = await getNotifications(session.user.id)
          if (error) {
            toast.error(error)
          } else if (data) {
            setNotifications(data)
          }
        } catch (error) {
          console.error("Failed to load notifications:", error)
          toast.error("Failed to load notifications")
        } finally {
          setLoading(false)
        }
      }
    }

    loadNotifications()

    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)

    return () => clearInterval(interval)
  }, [session?.user?.id])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAsRead = useCallback(async (id: string) => {
    if (!session?.user?.id) return

    try {
      const { notification, error } = await markAsRead(session.user.id, id)
      if (error) {
        toast.error(error)
      } else if (notification) {
        setNotifications((current) =>
          current.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      toast.error("Failed to mark notification as read")
    }
  }, [session?.user?.id])

  const handleMarkAllAsRead = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const { error } = await markAllAsReadAction(session.user.id)
      if (error) {
        toast.error(error)
      } else {
        setNotifications((current) =>
          current.map((notification) => ({ ...notification, read: true }))
        )
        toast.success("All notifications marked as read")
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
      toast.error("Failed to mark all notifications as read")
    }
  }, [session?.user?.id])

  const handleClearNotification = useCallback(async (id: string) => {
    if (!session?.user?.id) return

    try {
      const { error } = await clearNotificationAction(session.user.id, id)
      if (error) {
        toast.error(error)
      } else {
        setNotifications((current) =>
          current.filter((notification) => notification.id !== id)
        )
      }
    } catch (error) {
      console.error("Failed to clear notification:", error)
      toast.error("Failed to clear notification")
    }
  }, [session?.user?.id])

  const handleAddNotification = useCallback(async (data: Omit<Notification, "id" | "timestamp">) => {
    if (!session?.user?.id) return

    try {
      const { notification, error } = await addNotificationAction(session.user.id, data)
      if (error) {
        toast.error(error)
      } else if (notification) {
        setNotifications((current) => [notification, ...current])
        // Show a toast for new notifications
        toast(notification.title, {
          description: notification.message,
        })
      }
    } catch (error) {
      console.error("Failed to add notification:", error)
      toast.error("Failed to add notification")
    }
  }, [session?.user?.id])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    clearNotification: handleClearNotification,
    addNotification: handleAddNotification,
  }
}

