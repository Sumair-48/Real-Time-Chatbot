"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Message } from "@/lib/types"
import { format, isToday, isYesterday } from "date-fns"
import { useEffect, useRef } from "react"
import { Bot } from "lucide-react"

interface MessageListProps {
  messages: Message[]
  currentUserId: string
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-center">
        <div>
          <p className="text-muted-foreground">No messages yet.</p>
          <p className="text-sm text-muted-foreground">Be the first to send a message!</p>
        </div>
      </div>
    )
  }

  const groupedMessages = messages.reduce(
    (groups, message) => {
      const date = new Date(message.created_at)
      const dateKey = format(date, "yyyy-MM-dd")

      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
      return groups
    },
    {} as Record<string, Message[]>,
  )

  const formatDateLabel = (dateKey: string) => {
    const date = new Date(dateKey)
    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"
    return format(date, "MMMM d, yyyy")
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
        <div key={dateKey}>
          <div className="flex items-center justify-center my-4">
            <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
              {formatDateLabel(dateKey)}
            </div>
          </div>
          <div className="space-y-4">
            {dateMessages.map((message) => {
              const isOwn = message.user_id === currentUserId
              const isAI = message.type === "ai" || message.user_id === "00000000-0000-0000-0000-000000000000"
              const displayName = isAI ? "AI Assistant" : message.profile?.display_name || "Unknown"
              const initials = isAI
                ? "AI"
                : message.profile?.display_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "U"

              return (
                <div key={message.id} className={cn("flex gap-3", isOwn && "flex-row-reverse")}>
                  <Avatar className={cn("h-8 w-8", isAI && "bg-primary")}>
                    {isAI ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <Bot className="h-5 w-5 text-primary-foreground" />
                      </div>
                    ) : (
                      <>
                        <AvatarImage src={message.profile?.avatar_url || undefined} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div className={cn("flex flex-col gap-1 max-w-[70%]", isOwn && "items-end")}>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-medium", isAI && "text-primary")}>{displayName}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.created_at), "HH:mm")}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2",
                        isOwn && !isAI && "bg-primary text-primary-foreground",
                        !isOwn && !isAI && "bg-muted",
                        isAI && "bg-primary/10 border border-primary/20",
                      )}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
