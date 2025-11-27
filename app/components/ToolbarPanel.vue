<script setup lang="ts">
import { computed } from 'vue'
import type { usePixelBoard } from '../composables/usePixelBoard'

// Board store shared from the parent page.
type PixelBoardStore = ReturnType<typeof usePixelBoard>

const props = defineProps<{
  board: PixelBoardStore
}>()

const quickPalette = ['#0ea5e9', '#22c55e', '#f97316', '#ef4444', '#a855f7', '#facc15']

// Count the number of pixels that have been colored on the board.
const totalPixelsPlaced = computed(() => {
  return props.board.pixels.value.reduce((count, color) => {
    if (!color) return count
    return color.toLowerCase() === '#f8fafc' ? count : count + 1
  }, 0)
})

// Derive the total number of cells on the square board.
const totalCells = computed(() => props.board.size.value * props.board.size.value)

// Update the selected color when a quick-palette swatch is clicked.
const handleQuickColorSelect = (color: string) => {
  props.board.setColor(color)
}

// Sync the store color when the native color input changes.
const handleColorInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  if (!target) return
  props.board.setColor(target.value)
}
</script>

<template>
  <section class="toolbar">
    <div class="toolbar__body">
      <!-- Color picker + quick swatches -->
      <div class="toolbar__color">
        <div class="color-card">
          <p class="label">Couleur sélectionnée</p>
          <div class="color-card__current">
            <input
              type="color"
              class="color-card__swatch"
              :value="props.board.selectedColor.value"
              aria-label="Ajuster la couleur"
              @input="handleColorInput"
            />
            <div>
              <p class="color-card__value">{{ props.board.selectedColor.value.toUpperCase() }}</p>
              <p class="color-card__hint">Clique sur le carré pour affiner, ou choisis un raccourci.</p>
            </div>
          </div>
          <div class="color-card__quick" role="list">
            <button
              v-for="color in quickPalette"
              :key="color"
              type="button"
              class="quick-color"
              :class="{ 'quick-color--active': color.toLowerCase() === props.board.selectedColor.value }"
              :style="{ backgroundColor: color }"
              :aria-label="`Choisir la couleur ${color}`"
              @click="handleQuickColorSelect(color)"
            />
          </div>
        </div>
      </div>
      <div class="toolbar__divider" aria-hidden="true" />
      <!-- Live pixel count summary -->
      <div class="toolbar__stats">
        <p class="toolbar__stats-label">Pixels posés</p>
        <p class="toolbar__stats-value">{{ totalPixelsPlaced }}</p>
        <p class="toolbar__stats-hint">sur {{ totalCells || 0 }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Toolbar layout */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  border-radius: 1.5rem;
  background: var(--panel-bg);
  box-shadow: var(--panel-shadow);
  backdrop-filter: blur(18px);
}

.toolbar__body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.toolbar__color {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 240px;
}

.color-card {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 1.25rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(99, 102, 241, 0.08));
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.color-card .label {
  margin: 0;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.color-card__current {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.color-card__swatch {
  width: 64px;
  height: 64px;
  border-radius: 1rem;
  border: 2px solid rgba(15, 23, 42, 0.1);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
  cursor: pointer;
  padding: 0;
  -webkit-appearance: none;
  appearance: none;
  background: none;
  background-clip: padding-box;
  outline: none;
}

.color-card__swatch:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: 2px;
}

.color-card__swatch::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-card__swatch::-webkit-color-swatch {
  border: none;
  border-radius: 0.85rem;
}

.color-card__swatch::-moz-color-swatch {
  border: none;
  border-radius: 0.85rem;
}

.color-card__value {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.color-card__hint {
  margin: 0.25rem 0 0;
  color: #475569;
  font-size: 0.9rem;
}

.color-card__quick {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.quick-color {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: transform 0.15s ease, border-color 0.15s ease;
  cursor: pointer;
}

.quick-color--active {
  border-color: rgba(15, 23, 42, 0.65);
  transform: scale(1.05);
}

.toolbar__divider {
  width: 1px;
  min-height: 60px;
  background: linear-gradient(to bottom, rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0));
}

.toolbar__stats {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  min-width: 150px;
}

.toolbar__stats-label {
  margin: 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.08em;
}

.toolbar__stats-value {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
}

.toolbar__stats-hint {
  margin: 0;
  color: #475569;
  font-size: 0.9rem;
}
</style>
