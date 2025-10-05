"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Profile, RoomMember } from "@/lib/types"
import { Circle } from "lucide-react"

interface RoomMembersProps {
  roomId: string
}

interface MemberWithProfile extends RoomMember {
  profile: Profile
}

export function RoomMembers({ roomId }: RoomMembersProps) {
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMembers()
  }, [roomId])

  const loadMembers = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("room_members")
      .select(
        `
        *,
        profile:profiles(*)
      `,
      )
      .eq("room_id", roomId)
      .order("joined_at", { ascending: true })

    if (data) {
      setMembers(data as MemberWithProfile[])
    }
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading members...</p>
      </div>
    )
  }

  const onlineMembers = members.filter((m) => m.profile?.status === "online")
  const offlineMembers = members.filter((m) => m.profile?.status !== "online")

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Members ({members.length})</h3>
        <p className="text-xs text-muted-foreground">{onlineMembers.length} online</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {onlineMembers.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase">Online</p>
              {onlineMembers.map((member) => {
                const initials =
                  member.profile?.display_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "U"

                return (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profile?.avatar_url || undefined} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.profile?.display_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground truncate">@{member.profile?.username}</p>
                    </div>
                    {member.role !== "member" && (
                      <Badge variant="secondary" className="text-xs">
                        {member.role}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {offlineMembers.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase">Offline</p>
              {offlineMembers.map((member) => {
                const initials =
                  member.profile?.display_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "U"

                return (
                  <div key={member.id} className="flex items-center gap-3 opacity-60">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.profile?.display_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground truncate">@{member.profile?.username}</p>
                    </div>
                    {member.role !== "member" && (
                      <Badge variant="secondary" className="text-xs">
                        {member.role}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
