"use client"

import { formatDistanceToNow } from "date-fns"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Notification } from "@/lib/types/notification"

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: () => void
  onClear: () => void
}

export function NotificationItem({ notification, onMarkAsRead, onClear }: NotificationItemProps) {
  const { title, message, type, read, timestamp } = notification

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onMarkAsRead()
    }
  }

  return (
    <button
      type="button"
      className={cn(
        "group relative flex w-full flex-col gap-1 rounded-lg p-3 text-left transition-colors",
        !read && "bg-muted/50",
        "hover:bg-muted"
      )}
      onClick={onMarkAsRead}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium leading-none">{title}</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            onClear()
          }}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear notification</span>
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex h-2 w-2 rounded-full",
            type === "transaction" && "bg-blue-500",
            type === "system" && "bg-green-500",
            type === "alert" && "bg-red-500"
          )}
        />
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </span>
      </div>
    </button>
  )
}

