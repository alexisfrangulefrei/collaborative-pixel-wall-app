<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  size: number
  pixels: string[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  (event: 'paint', payload: { x: number; y: number }): void
}>()

// Keep the CSS grid definition in sync with the requested board size.
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.size}, minmax(0, 1fr))`,
  gridTemplateRows: `repeat(${props.size}, minmax(0, 1fr))`
}))

// Translate the clicked index into x/y coordinates before emitting.
const paintPixel = (index: number) => {
  if (props.disabled) return
  const x = index % props.size
  const y = Math.floor(index / props.size)
  emit('paint', { x, y })
}
</script>

<template>
  <!-- Uniform grid of clickable pixels -->
  <div class="pixel-board" :style="gridStyle">
    <button
      v-for="(color, index) in pixels"
      :key="index"
      class="pixel"
      type="button"
      :style="{ backgroundColor: color }"
      :disabled="disabled"
      @click="paintPixel(index)"
      :aria-label="`Colorier (${index % size}, ${Math.floor(index / size)})`"
    />
  </div>
</template>

<style scoped>
/* Interactive pixel grid */
.pixel-board {
  width: min(720px, 90vw);
  aspect-ratio: 1 / 1;
  display: grid;
  border-radius: 1.5rem;
  overflow: hidden;
  border: 6px solid #0f172a;
  background: #111827;
}

.pixel {
  border: none;
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  transition: transform 0.08s ease;
}

.pixel:disabled {
  cursor: not-allowed;
}

.pixel:not(:disabled):hover {
  transform: scale(1.05);
}

.pixel:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: -2px;
}
</style>
