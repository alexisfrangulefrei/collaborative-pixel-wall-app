<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { LeafletMouseEvent, Map as LeafletMap } from 'leaflet'
import type { AvatarId } from '../../types/avatars'
import type { PixelOwnerInfo } from '../../types/board'
import { getAvatarOption } from '../../constants/avatars'

const props = defineProps<{
  size: number
  pixels: string[]
  pixelOwners: PixelOwnerInfo[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  (event: 'paint', payload: { x: number; y: number }): void
}>()

const DEFAULT_COLOR = '#f8fafc'
const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-85, -180],
  [85, 180]
]

const mapEl = ref<HTMLDivElement | null>(null)
const overlayCanvas = ref<HTMLCanvasElement | null>(null)
let map: LeafletMap | null = null
let leaflet: typeof import('leaflet') | null = null
let frame: number | null = null
// Track tooltip visibility and metadata for hovered pixels.
const tooltip = ref<{ visible: boolean; x: number; y: number; owner: PixelOwnerInfo | null }>(
  {
    visible: false,
    x: 0,
    y: 0,
    owner: null
  }
)

const tooltipStyle = computed(() => ({
  left: `${tooltip.value.x}px`,
  top: `${tooltip.value.y}px`
}))

const fallbackAvatar = { emoji: '🎨', label: 'Créateur inconnu' }
// Convert stored avatar ids into user-facing metadata for the tooltip.
const resolveAvatar = (id: AvatarId | null | undefined) => getAvatarOption(id ?? undefined) ?? fallbackAvatar

const hideTooltip = () => {
  tooltip.value.visible = false
  tooltip.value.owner = null
}

const clampIndex = (value: number) => Math.min(Math.max(value, 0), props.size - 1)

const getWorldMetrics = () => {
  if (!map || !leaflet) return null
  const zoom = map.getZoom()
  const worldBounds = map.getPixelWorldBounds(zoom)
  if (!worldBounds) return null
  const worldSize = worldBounds.getSize()
  const cellSize = worldSize.x / props.size
  return {
    zoom,
    worldMin: worldBounds.min ?? leaflet.point(0, 0),
    cellSize
  }
}

const coordsToIndex = (lat: number, lng: number) => {
  if (!map) return { x: 0, y: 0 }
  const metrics = getWorldMetrics()
  if (!metrics) return { x: 0, y: 0 }
  const point = map.project({ lat, lng }, metrics.zoom)
  const x = Math.floor((point.x - metrics.worldMin.x) / metrics.cellSize)
  const y = Math.floor((point.y - metrics.worldMin.y) / metrics.cellSize)
  return { x: clampIndex(x), y: clampIndex(y) }
}

const resizeCanvas = () => {
  if (!map || !overlayCanvas.value) return
  const { x: width, y: height } = map.getSize()
  const dpr = window.devicePixelRatio || 1
  overlayCanvas.value.width = width * dpr
  overlayCanvas.value.height = height * dpr
  overlayCanvas.value.style.width = `${width}px`
  overlayCanvas.value.style.height = `${height}px`
}

// Paint the current grid state onto the overlay canvas respecting zoom/offset.
const drawPixels = () => {
  if (!map || !overlayCanvas.value || !leaflet) return
  const ctx = overlayCanvas.value.getContext('2d')
  if (!ctx) return

  const metrics = getWorldMetrics()
  if (!metrics) return

  resizeCanvas()
  const dpr = window.devicePixelRatio || 1
  ctx.clearRect(0, 0, overlayCanvas.value.width, overlayCanvas.value.height)

  for (let y = 0; y < props.size; y++) {
    for (let x = 0; x < props.size; x++) {
      const color = props.pixels[y * props.size + x]
      if (!color || color.toLowerCase() === DEFAULT_COLOR) {
        continue
      }
      const worldX = metrics.worldMin.x + x * metrics.cellSize
      const worldY = metrics.worldMin.y + y * metrics.cellSize
      const topLeft = leaflet.point(worldX, worldY)
      const bottomRight = leaflet.point(worldX + metrics.cellSize, worldY + metrics.cellSize)
      const nwLatLng = map.unproject(topLeft, metrics.zoom)
      const seLatLng = map.unproject(bottomRight, metrics.zoom)
      const nw = map.latLngToContainerPoint(nwLatLng)
      const se = map.latLngToContainerPoint(seLatLng)

      const left = Math.min(nw.x, se.x) * dpr
      const top = Math.min(nw.y, se.y) * dpr
      const width = Math.abs(se.x - nw.x) * dpr
      const height = Math.abs(se.y - nw.y) * dpr
      const sizePx = Math.max(width, height) || 1

      ctx.fillStyle = color
      ctx.fillRect(left, top, sizePx, sizePx)
    }
  }
}

// Debounce draw calls so we only render once per animation frame.
const scheduleDraw = () => {
  if (frame) cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => {
    drawPixels()
    frame = null
  })
}

// Tear down listeners/canvas to avoid leaking when the component unmounts.
const destroyMap = () => {
  if (frame) cancelAnimationFrame(frame)
  frame = null
  map?.off()
  map?.remove()
  map = null
  hideTooltip()
}

const handleMapClick = (event: LeafletMouseEvent) => {
  if (props.disabled) return
  const { lat, lng } = event.latlng
  const { x, y } = coordsToIndex(lat, lng)
  emit('paint', { x, y })
}

// Update tooltip placement and info as the user hovers over cells.
const handleMouseMove = (event: LeafletMouseEvent) => {
  if (!map || props.disabled) {
    hideTooltip()
    return
  }
  const { lat, lng } = event.latlng
  const { x, y } = coordsToIndex(lat, lng)
  const index = y * props.size + x
  const color = props.pixels[index]
  const owner = props.pixelOwners[index]
  if (!color || color.toLowerCase() === DEFAULT_COLOR || !owner || !owner.name) {
    hideTooltip()
    return
  }
  tooltip.value = {
    visible: true,
    x: event.containerPoint.x,
    y: event.containerPoint.y,
    owner
  }
}

// Initialize Leaflet along with the tile layer and overlay canvas.
const initMap = async () => {
  if (!mapEl.value || typeof window === 'undefined') return
  leaflet = await import('leaflet')
  map = leaflet.map(mapEl.value, {
    zoomControl: true,
    attributionControl: false,
    minZoom: 2,
    maxZoom: 5,
    worldCopyJump: false,
    maxBounds: WORLD_BOUNDS,
    maxBoundsViscosity: 1
  })

  map.setView([20, 0], 2)

  leaflet
    .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      noWrap: true,
      bounds: WORLD_BOUNDS
    })
    .addTo(map)

  map.on('click', handleMapClick)
  map.on('zoom', scheduleDraw)
  map.on('move', scheduleDraw)
  map.on('resize', scheduleDraw)
  map.on('mousemove', handleMouseMove)
  map.on('mouseout', hideTooltip)
  map.on('zoomstart', hideTooltip)
  map.on('movestart', hideTooltip)

  scheduleDraw()
}

onMounted(initMap)

onBeforeUnmount(() => {
  destroyMap()
})

// Redraw the canvas overlay whenever the pixel colors mutate.
watch(
  () => props.pixels.slice(),
  () => {
    scheduleDraw()
  }
)

// Hide tooltips if pixel ownership info changes beneath the cursor.
watch(
  () => props.pixelOwners.slice(),
  () => {
    hideTooltip()
  }
)

// Disable tooltips entirely when the board is locked.
watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) hideTooltip()
  }
)
</script>

<template>
  <!-- Leaflet canvas with custom pixel overlay -->
  <div class="world-map">
    <div ref="mapEl" class="world-map__canvas" />
    <canvas ref="overlayCanvas" class="world-map__overlay" />
    <div
      v-if="tooltip.visible && tooltip.owner?.name"
      class="world-map__tooltip"
      :style="tooltipStyle"
    >
      <span class="world-map__tooltip-avatar">{{ resolveAvatar(tooltip.owner?.avatar).emoji }}</span>
      <div class="world-map__tooltip-content">
        <p class="world-map__tooltip-name">{{ tooltip.owner?.name }}</p>
        <p class="world-map__tooltip-label">{{ resolveAvatar(tooltip.owner?.avatar).label }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Map host container plus tooltip theme */
.world-map {
  position: relative;
  width: 100%;
  min-height: 520px;
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: var(--panel-shadow);
}

.world-map__canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.world-map__overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

.world-map__tooltip {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.85);
  color: #f8fafc;
  font-size: 0.85rem;
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.25);
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 12px));
  z-index: 20;
  white-space: nowrap;
}

.world-map__tooltip-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: #0f172a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.world-map__tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.world-map__tooltip-name {
  margin: 0;
  font-weight: 600;
}

.world-map__tooltip-label {
  margin: 0;
  color: rgba(248, 250, 252, 0.7);
  font-size: 0.75rem;
}

:global(.leaflet-container) {
  background: #010817;
  font-family: inherit;
}

:global(.leaflet-pane) {
  filter: saturate(0.85) contrast(1.05);
}
</style>
