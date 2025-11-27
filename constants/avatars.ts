// Canonical list of avatar choices exposed to both client and server.
import type { AvatarId } from '../types/avatars'

export interface AvatarOption {
  id: AvatarId
  label: string
  emoji: string
  description: string
}

export const AVATAR_OPTIONS: readonly AvatarOption[] = [
  { id: 'pixel-astronaut', label: 'Astronaute', emoji: '👩‍🚀', description: 'Paré pour explorer la fresque.' },
  { id: 'pixel-robot', label: 'Robot', emoji: '🤖', description: 'Toujours précis au placement.' },
  { id: 'pixel-fox', label: 'Renard', emoji: '🦊', description: 'Amoureux des motifs rusés.' },
  { id: 'pixel-octopus', label: 'Pieuvre', emoji: '🐙', description: 'Pose des pixels à toute vitesse.' },
  { id: 'pixel-dragon', label: 'Dragon', emoji: '🐉', description: 'Ajoute une touche flamboyante.' },
  { id: 'pixel-unicorn', label: 'Licorne', emoji: '🦄', description: 'Transforme la grille en rêve.' }
] as const

// Precompute a map to allow O(1) lookups by id.
const AVATAR_DICTIONARY = AVATAR_OPTIONS.reduce<Record<AvatarId, AvatarOption>>((acc, option) => {
  acc[option.id] = option
  return acc
}, {} as Record<AvatarId, AvatarOption>)

// Type guard ensuring arbitrary inputs match a known avatar id.
export const isAvatarId = (value: unknown): value is AvatarId => {
  return typeof value === 'string' && Boolean(AVATAR_DICTIONARY[value as AvatarId])
}

// Convenience helper to fetch the full avatar metadata from the id.
export const getAvatarOption = (id?: AvatarId | null) => {
  if (!id) return null
  return AVATAR_DICTIONARY[id] ?? null
}
