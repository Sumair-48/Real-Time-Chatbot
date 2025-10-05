# Real-Time Chat Application

A full-featured real-time chat application built with Next.js, Supabase, and Socket.IO with AI assistant integration.

## Features

### Authentication
- Email/password authentication with Supabase Auth
- Automatic profile creation on signup
- Secure session management with middleware
- Protected routes

### Chat Rooms
- Create public and private chat rooms
- Join and leave rooms
- View room members with online/offline status
- Room admin and moderator roles

### Real-Time Messaging
- Instant message delivery with Socket.IO
- Typing indicators
- Online/offline status tracking
- Message history with pagination
- Search messages within rooms
- Auto-scroll to latest messages
- Date-grouped message display

### AI Assistant
- Integrated LLM (Llama 3.3 70B) for intelligent chat responses
- Mention @ai in any message to get AI assistance
- Context-aware responses using conversation history
- Visual distinction for AI messages with bot icon
- Configurable model and API endpoint

### User Features
- User profiles with avatars
- Display names and usernames
- User status (online/offline/away)
- Member list with role badges

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes, Socket.IO
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Socket.IO
- **AI**: Custom LLM API integration (OpenRouter compatible)
- **UI**: shadcn/ui, Tailwind CSS
- **Date Handling**: date-fns

## Database Schema

### Tables
- `profiles` - User profiles extending auth.users
- `chat_rooms` - Chat room information
- `room_members` - Join table for users and rooms
- `messages` - Chat messages (includes AI messages with type='ai')

All tables use Row Level Security (RLS) for data protection.

## Getting Started

1. Install dependencies (handled automatically by v0)
2. Set up Supabase integration in Project Settings
3. Run the SQL scripts in the `scripts` folder to create the database schema
4. Add LLM API credentials to environment variables (see below)
5. Start the development server
6. Sign up for an account and start chatting!

## Environment Variables

### Supabase (Auto-configured)
All Supabase environment variables are automatically configured through the integration:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- And other database connection variables

### LLM Integration (Required for AI features)
Add these environment variables in Project Settings:

- `LLM_API_KEY` - Your LLM API key (required)
- `LLM_API_URL` - API endpoint URL (optional, defaults to OpenRouter)
  - Default: `https://openrouter.ai/api/v1/chat/completions`
- `LLM_MODEL` - Model identifier (optional)
  - Default: `meta-llama/llama-3.3-70b-instruct:free`
- `NEXT_PUBLIC_SITE_URL` - Your site URL for API referrer (optional)

## API Routes

- `GET /api/messages` - Fetch message history with pagination
- `GET /api/socket` - Socket.IO server endpoint
- `POST /api/ai/chat` - AI chat completion endpoint

## Socket.IO Events

### Client → Server
- `join-room` - Join a chat room
- `leave-room` - Leave a chat room
- `send-message` - Send a message
- `typing` - Typing indicator
- `update-status` - Update user status

### Server → Client
- `new-message` - Receive new message
- `user-joined` - User joined room
- `user-left` - User left room
- `user-typing` - User typing indicator
- `user-status-changed` - User status update

## Using the AI Assistant

To interact with the AI assistant in any chat room:

1. Type a message that includes `@ai` or starts with `ai`
2. Example: "@ai what's the weather like today?"
3. The AI will respond with context from recent conversation
4. AI messages are displayed with a bot icon and special styling

The AI assistant uses the last 10 messages as context for more relevant responses.

## Security

- Row Level Security (RLS) on all tables
- Users can only access rooms they're members of
- Messages are protected by room membership
- Secure authentication with Supabase
- CSRF protection with middleware
- AI API key stored securely in environment variables

## Future Enhancements

- File and image uploads
- Message reactions
- Direct messages
- Push notifications
- Message editing and deletion
- User blocking
- Room invitations
- Voice/video calls
- Advanced AI features (summarization, moderation)
