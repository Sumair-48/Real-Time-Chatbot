export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  status: "online" | "offline" | "away"
  created_at: string
  updated_at: string
}

export interface ChatRoom {
  id: string
  name: string
  description: string | null
  type: "public" | "private"
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface RoomMember {
  id: string
  room_id: string
  user_id: string
  role: "admin" | "moderator" | "member"
  joined_at: string
}

export interface Message {
  id: string
  room_id: string
  user_id: string
  content: string
  type: "text" | "image" | "file"
  created_at: string
  updated_at: string
  profile?: Profile
}
