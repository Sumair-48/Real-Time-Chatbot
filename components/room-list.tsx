"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Lock, Globe } from "lucide-react"
import Link from "next/link"
import type { ChatRoom } from "@/lib/types"

interface RoomWithMembers extends ChatRoom {
  room_members: { count: number }[]
}

interface RoomListProps {
  rooms: RoomWithMembers[]
  userId: string
}

export function RoomList({ rooms, userId }: RoomListProps) {
  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">No chat rooms available yet.</p>
        <p className="text-sm text-muted-foreground">Create your first room to get started!</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => {
        const memberCount = room.room_members?.[0]?.count || 0

        return (
          <Card key={room.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {room.type === "private" ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                    {room.name}
                  </CardTitle>
                  <CardDescription className="mt-2">{room.description || "No description"}</CardDescription>
                </div>
                <Badge variant={room.type === "private" ? "secondary" : "default"}>{room.type}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{memberCount} members</span>
                </div>
                <Button asChild size="sm">
                  <Link href={`/chat/${room.id}`}>Join</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
