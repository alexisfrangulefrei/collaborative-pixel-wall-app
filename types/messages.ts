import type { HexColor } from './colors'
import type { PixelBroadcast, PixelOwnerInfo, PixelUpdate } from './board'
import type { ConnectedUser, UserRole } from './users'
import type { AvatarId } from './avatars'

// Socket message contracts exchanged between the client and server.

// Client-side paint command forwarded over the socket.
export interface PaintMessage extends Omit<PixelUpdate, 'color'> {
  color: HexColor
  type: 'paint'
}

// Join request emitted when a visitor registers their identity.
export interface JoinMessage {
  type: 'join'
  name: string
  role: UserRole
  avatar: AvatarId
}

// Admin-only command used to disconnect a user by id.
export interface KickMessage {
  type: 'kick'
  targetUserId: string
}

// Union of every message a client may emit over the socket.
export type ClientMessage = PaintMessage | JoinMessage | KickMessage

// Payload emitted when a peer first connects and needs the full board.
export interface ServerInitMessage {
  type: 'init'
  size: number
  pixels: HexColor[]
  owners: PixelOwnerInfo[]
  users: ConnectedUser[]
}

// Broadcast notifying peers about a single pixel update.
export interface ServerPixelMessage {
  type: 'pixel'
  pixel: PixelBroadcast
}

// Structured error returned to a single peer.
export interface ServerErrorMessage {
  type: 'error'
  message: string
}

// Live list of connected users delivered to the clients.
export interface ServerUsersMessage {
  type: 'users'
  users: ConnectedUser[]
}

// Confirmation sent when a visitor has been accepted as a user.
export interface ServerUserAcceptedMessage {
  type: 'user-accepted'
  user: ConnectedUser
}

// Notification sent when a user gets disconnected by an admin.
export interface ServerKickedMessage {
  type: 'kicked'
  reason?: string
}

// Union of every structured payload the server can emit.
export type ServerMessage =
  | ServerInitMessage
  | ServerPixelMessage
  | ServerErrorMessage
  | ServerUsersMessage
  | ServerUserAcceptedMessage
  | ServerKickedMessage

// Helper type representing both inbound and outbound socket payloads.
export type SocketMessage = ClientMessage | ServerMessage
