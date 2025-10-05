import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams
  const roomId = searchParams.get("roomId")
  const before = searchParams.get("before")
  const limit = Number.parseInt(searchParams.get("limit") || "50")

  if (!roomId) {
    return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a member of the room
    const { data: membership } = await supabase
      .from("room_members")
      .select("*")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this room" }, { status: 403 })
    }

    // Fetch messages
    let query = supabase
      .from("messages")
      .select(
        `
        *,
        profile:profiles(*)
      `,
      )
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (before) {
      query = query.lt("created_at", before)
    }

    const { data: messages, error } = await query

    if (error) throw error

    return NextResponse.json({ messages: messages?.reverse() || [] })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}
