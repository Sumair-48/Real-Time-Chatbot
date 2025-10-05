"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { getSocket } from "@/lib/socket"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Send, Users, Search } from "lucide-react"
import Link from "next/link"
import type { ChatRoom as ChatRoomType, Message, Profile } from "@/lib/types"
import { MessageList } from "@/components/message-list"
import { RoomMembers } from "@/components/room-members"

interface ChatRoomProps {
  room: ChatRoomType
  userId: string
  profile: Profile | null
}

export function ChatRoom({ room, userId, profile }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize socket
    socketRef.current = getSocket()
    const socket = socketRef.current

    // Join room
    socket.emit("join-room", room.id)

    socket.emit("update-status", { userId, status: "online" })

    // Load initial messages
    loadMessages()

    // Listen for new messages
    socket.on("new-message", (message: Message) => {
      setMessages((prev) => [...prev, message])
    })

    // Listen for typing
    socket.on("user-typing", ({ username, isTyping }: { username: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.includes(username) ? prev : [...prev, username]
        } else {
          return prev.filter((u) => u !== username)
        }
      })
    })

    return () => {
      socket.emit("leave-room", room.id)
      socket.emit("update-status", { userId, status: "offline" })
      socket.off("new-message")
      socket.off("user-typing")
    }
  }, [room.id, userId])

  const loadMessages = async (before?: string) => {
    const supabase = createClient()
    let query = supabase
      .from("messages")
      .select(
        `
        *,
        profile:profiles(*)
      `,
      )
      .eq("room_id", room.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (before) {
      query = query.lt("created_at", before)
    }

    const { data, error } = await query

    if (data) {
      const reversedData = [...data].reverse()
      if (before) {
        setMessages((prev) => [...reversedData, ...prev])
      } else {
        setMessages(reversedData as Message[])
      }
      setHasMore(data.length === 50)
    }
  }

  const loadMoreMessages = async () => {
    if (!hasMore || isLoadingMore || messages.length === 0) return

    setIsLoadingMore(true)
    await loadMessages(messages[0].created_at)
    setIsLoadingMore(false)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isLoading) return

    setIsLoading(true)
    const supabase = createClient()

    const mentionsAI =
      newMessage.toLowerCase().includes("@ai") ||
      newMessage.toLowerCase().trim().startsWith("ai ") ||
      newMessage.toLowerCase().trim() === "ai"

    console.log("[v0] Message content:", newMessage)
    console.log("[v0] Mentions AI:", mentionsAI)

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          room_id: room.id,
          user_id: userId,
          content: newMessage.trim(),
          type: "text",
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Failed to send message:", error)
        throw error
      }

      if (socketRef.current && data) {
        const messageWithProfile = {
          ...data,
          profile: profile,
        }
        socketRef.current.emit("send-message", {
          roomId: room.id,
          message: messageWithProfile,
        })
      }

      setNewMessage("")

      if (mentionsAI) {
        console.log("[v0] Calling AI API...")
        setIsAiThinking(true)
        try {
          const aiResponse = await fetch("/api/ai/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: newMessage.trim(),
              roomId: room.id,
              conversationHistory: messages.slice(-5),
            }),
          })

          console.log("[v0] AI API response status:", aiResponse.status)

          if (aiResponse.ok) {
            const aiData = await aiResponse.json()
            console.log("[v0] AI response data:", aiData)

            if (aiData.response) {
              const aiMessageWithProfile = {
                id: aiData.message?.id || `temp-${Date.now()}`,
                room_id: room.id,
                user_id: "00000000-0000-0000-0000-000000000000",
                content: aiData.response,
                type: "ai",
                created_at: new Date().toISOString(),
                profile: {
                  id: "00000000-0000-0000-0000-000000000000",
                  username: "AI Assistant",
                  display_name: "AI Assistant",
                  avatar_url: null,
                  status: "online",
                },
              }

              console.log("[v0] Adding AI message to chat")
              setMessages((prev) => [...prev, aiMessageWithProfile])

              if (socketRef.current) {
                socketRef.current.emit("send-message", {
                  roomId: room.id,
                  message: aiMessageWithProfile,
                })
              }
            } else {
              console.error("[v0] No response in AI data:", aiData)
            }
          } else {
            const errorText = await aiResponse.text()
            console.error("[v0] AI response failed with status:", aiResponse.status)
            console.error("[v0] AI error details:", errorText)

            alert(`AI Assistant Error: ${errorText}`)
          }
        } catch (aiError) {
          console.error("[v0] Failed to get AI response:", aiError)
          alert(`Failed to get AI response: ${aiError instanceof Error ? aiError.message : "Unknown error"}`)
        } finally {
          setIsAiThinking(false)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to send message:", error)
      alert(`Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTyping = () => {
    if (!socketRef.current || !profile) return

    socketRef.current.emit("typing", {
      roomId: room.id,
      username: profile.username,
      isTyping: true,
    })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("typing", {
        roomId: room.id,
        username: profile.username,
        isTyping: false,
      })
    }, 1000)
  }

  const filteredMessages = searchQuery
    ? messages.filter((msg) => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/chat">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{room.name}</h1>
              <p className="text-sm text-muted-foreground">{room.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSearch(!showSearch)}>
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowMembers(!showMembers)}>
              <Users className="h-4 w-4 mr-2" />
              Members
            </Button>
          </div>
        </div>
        {showSearch && (
          <div className="border-t px-6 py-3">
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            {hasMore && messages.length > 0 && (
              <div className="flex justify-center mb-4">
                <Button variant="outline" size="sm" onClick={loadMoreMessages} disabled={isLoadingMore}>
                  {isLoadingMore ? "Loading..." : "Load older messages"}
                </Button>
              </div>
            )}
            <MessageList messages={filteredMessages} currentUserId={userId} />
          </ScrollArea>

          {(typingUsers.length > 0 || isAiThinking) && (
            <div className="px-6 py-2 text-sm text-muted-foreground">
              {isAiThinking && "AI Assistant is thinking..."}
              {!isAiThinking && typingUsers.length > 0 && (
                <>
                  {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
                </>
              )}
            </div>
          )}

          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Type a message... (mention @ai for AI assistance)"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  handleTyping()
                }}
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {showMembers && (
          <div className="w-64 border-l">
            <RoomMembers roomId={room.id} />
          </div>
        )}
      </div>
    </div>
  )
}
