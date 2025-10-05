import { Server as SocketIOServer } from "socket.io"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

let io: SocketIOServer | null = null

export async function GET(req: NextRequest) {
  if (!io) {
    // @ts-ignore - Next.js socket server setup
    io = new SocketIOServer({
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })

    io.on("connection", (socket) => {
      console.log("[v0] Client connected:", socket.id)

      // Join room
      socket.on("join-room", (roomId: string) => {
        socket.join(roomId)
        console.log("[v0] User joined room:", roomId)
        socket.to(roomId).emit("user-joined", { socketId: socket.id })
      })

      // Leave room
      socket.on("leave-room", (roomId: string) => {
        socket.leave(roomId)
        console.log("[v0] User left room:", roomId)
        socket.to(roomId).emit("user-left", { socketId: socket.id })
      })

      // Send message
      socket.on("send-message", (data: { roomId: string; message: any }) => {
        console.log("[v0] Message sent to room:", data.roomId)
        io?.to(data.roomId).emit("new-message", data.message)
      })

      // Typing indicator
      socket.on("typing", (data: { roomId: string; username: string; isTyping: boolean }) => {
        socket.to(data.roomId).emit("user-typing", {
          username: data.username,
          isTyping: data.isTyping,
        })
      })

      // User status
      socket.on("update-status", (data: { userId: string; status: string }) => {
        socket.broadcast.emit("user-status-changed", data)
      })

      socket.on("disconnect", () => {
        console.log("[v0] Client disconnected:", socket.id)
      })
    })
  }

  return new Response("Socket.IO server running", { status: 200 })
}
