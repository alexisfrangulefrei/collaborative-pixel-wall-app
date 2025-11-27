import { computed, ref, shallowRef } from 'vue'
import type { AvatarId } from '../../types/avatars'
import type { ConnectedUser, UserRole } from '../../types/users'
import type { HexColor } from '../../types/colors'
import type { PixelOwnerInfo } from '../../types/board'
import type { ClientMessage } from '../../types/messages'

// Palette defaults keep the client aligned with the server's fallback color.
export const DEFAULT_COLOR: HexColor = '#2563eb'
export const FALLBACK_COLOR: HexColor = '#f1f5f9'

// Core reactive state used across the board UI and socket handlers.
export const size = ref(0)
export const pixels = ref<HexColor[]>([])
export const pixelOwners = ref<PixelOwnerInfo[]>([])
export const isConnected = ref(false)
export const users = ref<ConnectedUser[]>([])
export const currentUser = ref<ConnectedUser | null>(null)
export const selectedColor = ref<HexColor>(DEFAULT_COLOR)
export const lastError = ref<string | null>(null)
export const userError = ref<string | null>(null)
export const wasKicked = ref(false)
export const kickReason = ref<string | null>(null)

// Socket + reconnection bookkeeping shared between modules.
export const socket = shallowRef<WebSocket | null>(null)
export const reconnectTimer = shallowRef<ReturnType<typeof setTimeout> | null>(null)
export const joinIntent = shallowRef<{ name: string; role: UserRole; avatar: AvatarId } | null>(null)
export const autoReconnectAllowed = ref(true)

// Derived helpers that gate rendering and painting.
export const boardReady = computed(() => {
  const totalCells = size.value * size.value
  return size.value > 0 && pixels.value.length === totalCells && pixelOwners.value.length === totalCells
})

export const canPaint = computed(() => boardReady.value && !!currentUser.value && isConnected.value)

// JSON stringify helper keeps socket payload creation consistent.
export const stringify = (payload: ClientMessage) => JSON.stringify(payload)

// Ensure we always close sockets before replacing them.
export const cleanupSocket = () => {
  socket.value?.close()
  socket.value = null
}
