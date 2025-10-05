import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ChatRoom } from "@/components/chat-room"
import { notFound } from "next/navigation"

interface ChatRoomPageProps {
  params: Promise<{
    roomId: string
  }>
}

export default async function ChatRoomPage({ params }: ChatRoomPageProps) {
  const { roomId } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  // Fetch room details
  const { data: room, error: roomError } = await supabase.from("chat_rooms").select("*").eq("id", roomId).single()

  if (roomError || !room) {
    notFound()
  }

  // Check if user is a member
  const { data: membership } = await supabase
    .from("room_members")
    .select("*")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .single()

  // If not a member, add them
  if (!membership) {
    const { error: joinError } = await supabase.from("room_members").insert({
      room_id: roomId,
      user_id: user.id,
      role: "member",
    })

    if (joinError) {
      console.error("Failed to join room:", joinError)
    }
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return <ChatRoom room={room} userId={user.id} profile={profile} />
}
