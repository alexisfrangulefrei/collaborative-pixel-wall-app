import type { AvatarId } from './avatars'

// User identity shapes mirrored between client and server.
// Discrete roles available for registered users.
export type UserRole = 'participant' | 'administrateur'

// Real-time snapshot of a connected user as known by the server.
export interface ConnectedUser {
  id: string
  name: string
  role: UserRole
  avatar: AvatarId
}
