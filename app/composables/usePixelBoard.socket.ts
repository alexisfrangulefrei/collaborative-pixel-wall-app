import {
  autoReconnectAllowed,
  cleanupSocket,
  isConnected,
  joinIntent,
  kickReason,
  lastError,
  reconnectTimer,
  socket,
  stringify,
  userError,
  wasKicked
} from './usePixelBoard.state'
import { handleServerMessage, parseMessage } from './usePixelBoard.messaging'

// Build the websocket endpoint by mirroring the current page protocol.
const createUrl = () => {
  if (typeof window === 'undefined') return ''
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/api/pixels`
}

// Retry connection attempts with a small delay when the socket closes unexpectedly.
const scheduleReconnect = () => {
  if (reconnectTimer.value || !autoReconnectAllowed.value) return
  reconnectTimer.value = setTimeout(() => {
    reconnectTimer.value = null
    connect()
  }, 2000)
}

// Establish the websocket bridge and wire up listeners once per page.
export const connect = () => {
  if (typeof window === 'undefined') return
  if (
    socket.value &&
    (socket.value.readyState === WebSocket.OPEN || socket.value.readyState === WebSocket.CONNECTING)
  ) {
    return
  }

  const url = createUrl()
  if (!url) return

  const ws = new WebSocket(url)
  socket.value = ws

  ws.addEventListener('open', () => {
    isConnected.value = true
    lastError.value = null
    autoReconnectAllowed.value = true
    if (joinIntent.value) {
      ws.send(stringify({ type: 'join', ...joinIntent.value }))
      userError.value = null
    }
  })

  ws.addEventListener('close', () => {
    isConnected.value = false
    scheduleReconnect()
  })

  ws.addEventListener('error', (event) => {
    console.error('WebSocket error', event)
    lastError.value = 'Connexion perdue'
    ws.close()
  })

  ws.addEventListener('message', (event) => handleServerMessage(parseMessage(event)))
}

// Helper invoked on mounted hooks to skip SSR.
export const connectOnceMounted = () => {
  if (typeof window === 'undefined') return
  connect()
}

// Manual reconnect button resets any kick flags then opens a fresh socket.
export const reconnect = () => {
  autoReconnectAllowed.value = true
  wasKicked.value = false
  kickReason.value = null
  cleanupSocket()
  connect()
}
