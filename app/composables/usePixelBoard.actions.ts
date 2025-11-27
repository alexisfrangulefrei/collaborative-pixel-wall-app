import type { AvatarId } from '../../types/avatars'
import type { PaintMessage } from '../../types/messages'
import type { UserRole } from '../../types/users'
import {
  DEFAULT_COLOR,
  FALLBACK_COLOR,
  canPaint,
  currentUser,
  isConnected,
  joinIntent,
  selectedColor,
  socket,
  stringify,
  userError
} from './usePixelBoard.state'
import type { HexColor } from '../../types/colors'

// Emit a paint command whenever the board is interactive.
export const paint = (x: number, y: number) => {
  if (!canPaint.value || !socket.value || socket.value.readyState !== WebSocket.OPEN) {
    return
  }

  const payload: PaintMessage = { type: 'paint', x, y, color: selectedColor.value ?? FALLBACK_COLOR }
  socket.value.send(stringify(payload))
}

// Validate identity inputs before requesting a session on the server.
export const registerUser = (name: string, wantsAdmin: boolean, avatar: AvatarId | null) => {
  const trimmed = name.trim()
  if (trimmed.length < 2 || trimmed.length > 24) {
    userError.value = 'Le nom doit contenir entre 2 et 24 caractères.'
    return
  }

  if (!avatar) {
    userError.value = 'Merci de choisir un avatar.'
    return
  }

  const role: UserRole = wantsAdmin ? 'administrateur' : 'participant'
  userError.value = null
  joinIntent.value = { name: trimmed, role, avatar }
  if (socket.value && socket.value.readyState === WebSocket.OPEN) {
    socket.value.send(stringify({ type: 'join', ...joinIntent.value }))
  } else if (!isConnected.value) {
    userError.value = 'Connexion en attente, réessayez après la reconnexion.'
  }
}

// Allow admins to request the disconnection of another participant.
export const kickUser = (targetUserId: string) => {
  if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
    return
  }
  if (!currentUser.value || currentUser.value.role !== 'administrateur') {
    return
  }
  socket.value.send(stringify({ type: 'kick', targetUserId }))
}

// Normalize user-entered colors so downstream logic only sees valid hex codes.
export const setColor = (color: string) => {
  if (!/^#([\da-f]{6})$/i.test(color)) {
    selectedColor.value = DEFAULT_COLOR
    return
  }
  selectedColor.value = color.toLowerCase() as HexColor
}
