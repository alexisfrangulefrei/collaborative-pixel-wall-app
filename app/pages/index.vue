<script setup lang="ts">
import { usePixelBoard } from '../composables/usePixelBoard'
import WorldMap from '../components/WorldMap.vue'
import IdentityPanel from '../components/IdentityPanel.vue'
import ToolbarPanel from '../components/ToolbarPanel.vue'
import TipsPanel from '../components/TipsPanel.vue'

const board = usePixelBoard()
const boardReady = board.boardReady

const handlePaint = (payload: { x: number; y: number }) => {
  board.paint(payload.x, payload.y)
}
</script>

<template>
  <!-- Landing layout orchestrating the hero, panels, and live board -->
  <main class="page">
    <section class="hero">
      <div>
        <h1>Mur de pixels collaboratif</h1>
        <p>
          Rejoins la session, choisis une couleur et clique sur la grille pour poser un pixel en direct.
        </p>
      </div>
    </section>

    <!-- Identity + connection management -->
    <IdentityPanel :board="board" />

    <!-- Static collaboration guidance -->
    <TipsPanel />

    <!-- Color picker + statistics toolbar -->
    <ToolbarPanel :board="board" />

    <!-- Map-powered pixel board with loading state -->
    <section class="board-wrapper">
      <div v-if="boardReady" class="board-wrapper__map">
        <WorldMap
          :size="board.size.value"
          :pixels="board.pixels.value"
          :pixel-owners="board.pixelOwners.value"
          :disabled="!board.canPaint.value"
          @paint="handlePaint"
        />
      </div>
      <div v-else class="loading">
        <span class="spinner" aria-hidden="true" />
        Connexion en cours...
      </div>
    </section>
  </main>
</template>

<style scoped>
/* Columnar stack for every section on the home page */
.page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  color: #0f172a;
}

/* Glassy hero banner introducing the project */
.hero {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: flex-start;
  padding: 1.5rem;
  border-radius: 1.5rem;
  background: var(--panel-bg);
  box-shadow: var(--panel-shadow);
  backdrop-filter: blur(18px);
}

.hero h1 {
  margin: 0.25rem 0;
  font-size: clamp(2rem, 5vw, 3.25rem);
  color: #0f172a;
}

.hero p {
  margin: 0;
  color: #475569;
  line-height: 1.5;
}

/* Board container removes surplus chrome so the map can stretch */
.board-wrapper {
  border-radius: 2rem;
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.board-wrapper__map {
  width: 100%;
  min-height: 520px;
}

/* Loading row shown while the socket bootstraps */
.loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #475569;
}

/* Minimal spinner synced with the brand colors */
.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  border: 3px solid #bae6fd;
  border-top-color: #0284c7;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
