import type { HexColor } from './colors'
import type { AvatarId } from './avatars'

// Board-level data contracts shared by the map overlay and websocket server.

// Minimal payload describing a colored board cell.
export interface PixelUpdate {
  x: number
  y: number
  color: HexColor
}

// Owner metadata stored alongside each colored pixel.
export interface PixelOwnerInfo {
  name: string | null
  avatar: AvatarId | null
}

// Broadcast payload bundling coordinates, color, and owner.
export interface PixelBroadcast extends PixelUpdate {
  owner: PixelOwnerInfo
}
