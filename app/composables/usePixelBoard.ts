import { onBeforeUnmount, onMounted } from 'vue'
import {
  boardReady,
  canPaint,
  cleanupSocket,
  currentUser,
  isConnected,
  kickReason,
  lastError,
  pixelOwners,
  pixels,
  reconnectTimer,
  selectedColor,
  size,
  userError,
  users,
  wasKicked
} from './usePixelBoard.state'
import { paint, registerUser, kickUser, setColor } from './usePixelBoard.actions'
import { connect, connectOnceMounted, reconnect } from './usePixelBoard.socket'

// Public composable that stitches together state, actions, and socket helpers.
export const usePixelBoard = () => {
  onMounted(connectOnceMounted)
  onBeforeUnmount(() => {
    cleanupSocket()
    if (reconnectTimer.value) {
      clearTimeout(reconnectTimer.value)
      reconnectTimer.value = null
    }
  })

  return {
    size,
    pixels,
    pixelOwners,
    isConnected,
    users,
    currentUser,
    canPaint,
    wasKicked,
    kickReason,
    selectedColor,
    lastError,
    userError,
    boardReady,
    paint,
    registerUser,
    kickUser,
    setColor,
    reconnect,
    connect
  }
}
