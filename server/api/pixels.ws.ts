// WebSocket handler powering the real-time pixel wall updates.
import { defineWebSocketHandler } from 'h3'
import type { AvatarId } from '../../types/avatars'
import type { ConnectedUser, UserRole } from '../../types/users'
import type { HexColor } from '../../types/colors'
import type { PixelOwnerInfo, PixelUpdate } from '../../types/board'
import type { ServerMessage } from '../../types/messages'
import { isAvatarId } from '../../constants/avatars'

const BOARD_SIZE = 64
const DEFAULT_COLOR: HexColor = '#f8fafc'
type Peer = { send: (data: string) => void; close?: (code?: number, reason?: string) => void }

// Keep peer <-> user associations plus the authoritative board state in memory.
const peers = new Set<Peer>()
const peerUsers = new Map<Peer, ConnectedUser>()
const userPeers = new Map<string, Peer>()
const pixels: HexColor[] = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => DEFAULT_COLOR)
const pixelOwners: PixelOwnerInfo[] = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => ({
  name: null,
  avatar: null
}))

// Generate a unique identifier used for newly connected users.
const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

// Shortcut helper to serialize outbound server payloads.
const serialize = (payload: ServerMessage) => JSON.stringify(payload)

// Normalize user-supplied colors into valid lowercase hex codes.
const normalizeColor = (color: string | undefined | null): HexColor | null => {
  if (!color) return null
  const compact = color.trim().toLowerCase()
  if (!/^#([\da-f]{6})$/.test(compact)) {
    return null
  }
  return compact as HexColor
}

// Ensure the provided username is a string within length constraints.
const sanitizeName = (value: unknown) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length < 2 || trimmed.length > 24) {
    return null
  }
  return trimmed
}

// Only accept the admin literal, default to participant otherwise.
const resolveRole = (value: unknown): UserRole => (value === 'administrateur' ? 'administrateur' : 'participant')

// Persist the latest color for the addressed board coordinate.
const applyPixel = (update: PixelUpdate) => {
  const index = update.y * BOARD_SIZE + update.x
  pixels[index] = update.color
}

// Provide shallow copies to avoid leaking live references to callers.
const usersSnapshot = () => Array.from(peerUsers.values())
const ownersSnapshot = () => pixelOwners.map((owner) => ({ ...owner }))

// Push a serialized payload to every connected peer.
const broadcast = (payload: ServerMessage) => {
  const data = serialize(payload)
  for (const peer of peers) {
    try {
      peer.send(data)
    } catch (error) {
      console.error('Failed to send to peer', error)
    }
  }
}

// Send the refreshed user list to every subscriber.
const broadcastUsers = () => {
  broadcast({ type: 'users', users: usersSnapshot() })
}

// Normalize various websocket payload formats into strings.
const toText = (message: any) => {
  if (typeof message.data === 'string') return message.data
  if (message.data instanceof ArrayBuffer) {
    return new TextDecoder().decode(message.data)
  }
  return String(message.data ?? '')
}

// Attempt to send a structured error back to a single peer.
const sendError = (peer: Peer, message: string) => {
  try {
    peer.send(serialize({ type: 'error', message }))
  } catch (error) {
    console.error('Failed to send error', error)
  }
}

// Guard avatar inputs by checking against the whitelist.
const sanitizeAvatar = (value: unknown): AvatarId | null => {
  if (typeof value !== 'string') return null
  return isAvatarId(value) ? (value as AvatarId) : null
}

// Validate a join attempt then attach the new user to the peer.
const handleJoin = (peer: Peer, payload: any) => {
  if (peerUsers.has(peer)) {
    return
  }

  const name = sanitizeName(payload?.name)
  if (!name) {
    sendError(peer, "Nom d'utilisateur invalide")
    return
  }

  const avatar = sanitizeAvatar(payload?.avatar)
  if (!avatar) {
    sendError(peer, 'Avatar invalide, merci de réessayer')
    return
  }

  const role = resolveRole(payload?.role)
  const user: ConnectedUser = { id: createId(), name, role, avatar }
  peerUsers.set(peer, user)
  userPeers.set(user.id, peer)
  peer.send(serialize({ type: 'user-accepted', user }))
  broadcastUsers()
}

// Apply a paint request if it comes from a registered participant.
const handlePaint = (peer: Peer, payload: any) => {
  const actor = peerUsers.get(peer)
  if (!actor) {
    sendError(peer, 'Crée un utilisateur avant de peindre')
    return
  }

  const x = Number(payload?.x)
  const y = Number(payload?.y)
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    return
  }
  if (x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE) {
    return
  }

  const color = normalizeColor(payload?.color)
  if (!color) {
    return
  }

  const update: PixelUpdate = { x, y, color }
  applyPixel(update)
  const owner: PixelOwnerInfo = { name: actor.name, avatar: actor.avatar }
  const index = y * BOARD_SIZE + x
  pixelOwners[index] = owner
  broadcast({ type: 'pixel', pixel: { ...update, owner } })
}

// Allow admins to disconnect regular participants.
const handleKick = (peer: Peer, payload: any) => {
  const actor = peerUsers.get(peer)
  if (!actor || actor.role !== 'administrateur') {
    sendError(peer, 'Seuls les administrateurs peuvent déconnecter des utilisateurs')
    return
  }

  const targetId = typeof payload?.targetUserId === 'string' ? payload.targetUserId : null
  if (!targetId || targetId === actor.id) {
    return
  }

  const targetPeer = userPeers.get(targetId)
  if (!targetPeer) {
    return
  }

  const targetUser = peerUsers.get(targetPeer)
  if (!targetUser) {
    return
  }

  if (targetUser.role === 'administrateur') {
    sendError(peer, 'Impossible de déconnecter un autre administrateur')
    return
  }

  try {
    targetPeer.send(serialize({ type: 'kicked', reason: "Déconnecté par un administrateur" }))
  } catch (error) {
    console.error('Failed to notify kicked peer', error)
  }

  if (typeof targetPeer.close === 'function') {
    targetPeer.close(4000, 'Kicked by admin')
  }
}

// Wire the handlers into h3 so Nuxt can accept ws connections.
export default defineWebSocketHandler({
  open(peer) {
    peers.add(peer)
    peer.send(
      serialize({ type: 'init', size: BOARD_SIZE, pixels, owners: ownersSnapshot(), users: usersSnapshot() })
    )
  },
  message(peer, message) {
    try {
      const raw = JSON.parse(toText(message))
      switch (raw?.type) {
        case 'join':
          handleJoin(peer, raw)
          break
        case 'paint':
          handlePaint(peer, raw)
          break
        case 'kick':
          handleKick(peer, raw)
          break
        default:
          break
      }
    } catch (error) {
      console.error('Could not parse message', error)
    }
  },
  close(peer) {
    peers.delete(peer)
    const user = peerUsers.get(peer)
    if (user) {
      peerUsers.delete(peer)
      userPeers.delete(user.id)
      broadcastUsers()
    }
  }
})
