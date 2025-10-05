import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RoomList } from "@/components/room-list"
import { CreateRoomDialog } from "@/components/create-room-dialog"
import { UserProfile } from "@/components/user-profile"

export default async function ChatPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch all chat rooms
  const { data: rooms } = await supabase
    .from("chat_rooms")
    .select("*, room_members(count)")
    .order("created_at", { ascending: false })

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b">
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-semibold">Chat Rooms</h1>
          <div className="flex items-center gap-4">
            <CreateRoomDialog />
            <UserProfile profile={profile} />
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-6">
        <RoomList rooms={rooms || []} userId={user.id} />
      </main>
    </div>
  )
}
