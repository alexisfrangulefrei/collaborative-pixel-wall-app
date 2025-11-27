import type { ServerMessage } from '../../types/messages'
import {
  autoReconnectAllowed,
  cleanupSocket,
  currentUser,
  isConnected,
  kickReason,
  lastError,
  pixelOwners,
  pixels,
  size,
  userError,
  users,
  wasKicked
} from './usePixelBoard.state'

// Safely parse inbound socket messages while guarding against malformed payloads.
export const parseMessage = (raw: MessageEvent) => {
  try {
    return JSON.parse(typeof raw.data === 'string' ? raw.data : String(raw.data)) as ServerMessage
  } catch (error) {
    console.error('Invalid socket payload', error)
    return null
  }
}

// Mirror every server message to the local reactive state tree.
export const handleServerMessage = (payload: ServerMessage | null) => {
  if (!payload) return

  if (payload.type === 'init') {
    size.value = payload.size
    pixels.value = payload.pixels.slice()
    pixelOwners.value = payload.owners.slice()
    users.value = payload.users.slice()
  }

  if (payload.type === 'pixel') {
    const index = payload.pixel.y * size.value + payload.pixel.x
    pixels.value.splice(index, 1, payload.pixel.color)
    pixelOwners.value.splice(index, 1, payload.pixel.owner)
  }

  if (payload.type === 'error') {
    lastError.value = payload.message
  }

  if (payload.type === 'users') {
    users.value = payload.users.slice()
  }

  if (payload.type === 'user-accepted') {
    currentUser.value = payload.user
    wasKicked.value = false
    kickReason.value = null
    lastError.value = null
    userError.value = null
  }

  if (payload.type === 'kicked') {
    const previousUserId = currentUser.value?.id
    autoReconnectAllowed.value = false
    wasKicked.value = true
    kickReason.value = payload.reason ?? 'Vous avez été déconnecté par un administrateur.'
    lastError.value = kickReason.value
    if (previousUserId) {
      users.value = users.value.filter((user) => user.id !== previousUserId)
    }
    currentUser.value = null
    cleanupSocket()
    isConnected.value = false
  }
}
