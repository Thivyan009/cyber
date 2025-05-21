"use client"

import { Bell } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { NotificationItem } from "./notification-item"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearNotification,
  } = useNotifications()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9"
          aria-label="View notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <h4 className="text-sm font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => markAllAsRead()}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex h-full items-center justify-center p-4">
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4">
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="p-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => markAsRead(notification.id)}
                  onClear={() => clearNotification(notification.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

