<template>
  <!-- Simple wrapper to center all pages on a cosmic gradient -->
  <div class="layout-shell">
    <div class="layout-shell__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* Full-height gradient background shared by every page */
.layout-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at top, #03112b, #010817 60%);
}

/* Slot container preserves stacking context for page content */
.layout-shell__content {
  flex: 1;
  position: relative;
}
</style>
