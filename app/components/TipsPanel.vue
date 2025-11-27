<template>
  <!-- Static collaboration tips -->
  <section class="tips">
    <div class="tips-card">
      <div class="tips__header">
        <h2>Astuces</h2>
        <p>Optimise ta contribution avec ces conseils rapides.</p>
      </div>
      <div class="tips__grid">
        <article class="tip-card">
          <p class="tip-card__title">Clique directement sur la carte</p>
          <p class="tip-card__text">
            Clique ou tape sur la carte pour peindre instantanément un pixel à l'endroit exact que tu vises.
          </p>
        </article>
        <article class="tip-card">
          <p class="tip-card__title">Zoome pour viser juste</p>
          <p class="tip-card__text">
            Utilise la molette ou le pincement pour agrandir la zone et éviter de déborder sur les pixels voisins.
          </p>
        </article>
        <article class="tip-card">
          <p class="tip-card__title">Partage la grille</p>
          <p class="tip-card__text">
            Définis des zones avec ton équipe pour limiter les collisions de couleurs et remplir la fresque plus vite.
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Tips layout extracted from the home page */
.tips {
  width: 100%;
}

.tips-card {
  padding: 1.5rem;
  border-radius: 1.5rem;
  background: var(--panel-bg);
  box-shadow: var(--panel-shadow);
  backdrop-filter: blur(18px);
}

.tips__header h2 {
  margin: 0 0 0.25rem;
}

.tips__header p {
  margin: 0;
  color: #475569;
}

.tips__grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
}

.tip-card {
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 0.75rem;
  padding: 0.85rem;
  background: #fff;
}

.tip-card__title {
  margin: 0 0 0.35rem;
  font-weight: 700;
  color: #0f172a;
}

.tip-card__text {
  margin: 0;
  color: #475569;
  line-height: 1.4;
}
</style>
