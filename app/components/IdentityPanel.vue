<script setup lang="ts">
import { computed, ref } from 'vue'
import type { usePixelBoard } from '../composables/usePixelBoard'
import type { AvatarId } from '../../types/avatars'
import { AVATAR_OPTIONS, getAvatarOption } from '../../constants/avatars'

// Reuse the shared board store provided by the parent.
type PixelBoardStore = ReturnType<typeof usePixelBoard>

const props = defineProps<{
  board: PixelBoardStore
}>()

const avatarOptions = AVATAR_OPTIONS
const userName = ref('')
const wantsAdmin = ref(false)
const selectedAvatar = ref<AvatarId | null>(avatarOptions[0]?.id ?? null)

// Surface the most relevant connection error message back to the user.
const connectionError = computed(() => {
  if (props.board.wasKicked.value && props.board.kickReason.value) {
    return props.board.kickReason.value
  }
  if (!props.board.isConnected.value && props.board.lastError.value) {
    return props.board.lastError.value
  }
  return null
})

// Track whether the current user has administrator privileges.
const isAdmin = computed(() => props.board.currentUser.value?.role === 'administrateur')

const fallbackAvatar = { emoji: '🎨', label: 'Créateur' }
// Resolve an avatar descriptor from its id, falling back to a default badge.
const resolveAvatar = (id: AvatarId | null | undefined) => getAvatarOption(id ?? undefined) ?? fallbackAvatar

// Handle the identity form submission by registering the visitor with the board.
const handleUserSubmit = () => {
  props.board.registerUser(userName.value, wantsAdmin.value, selectedAvatar.value)
}

// Allow administrators to disconnect another participant.
const handleKick = (targetId: string) => {
  props.board.kickUser(targetId)
}
</script>

<template>
  <section class="identity-panel">
    <div class="identity-panel__card identity-card">
      <div class="identity-card__grid">
        <!-- Live connection health + reconnect action -->
        <section class="identity-card__block connection-card">
          <header class="connection-card__header">
            <div>
              <p class="label">Etat de connexion avec le serveur</p>
              <p class="connection-card__status" :class="props.board.isConnected.value ? 'online' : 'offline'">
                <span class="connection-card__dot" aria-hidden="true" />
                {{ props.board.isConnected.value ? 'Connecté' : 'Déconnecté' }}
              </p>
            </div>
            <button class="ghost" type="button" @click="props.board.reconnect()" :disabled="props.board.isConnected.value">
              {{ props.board.isConnected.value ? 'Synchronisé' : 'Se reconnecter' }}
            </button>
          </header>
          <p class="identity-card__hint muted">
            {{ props.board.isConnected.value ? 'La fresque se met à jour en direct.' : 'Tente une reconnexion pour reprendre.' }}
          </p>
          <p v-if="connectionError" class="error">{{ connectionError }}</p>
        </section>

        <!-- Registration form or session summary once connected -->
        <section v-if="props.board.isConnected.value" class="identity-card__block identity-block">
          <header class="identity-block__header">
            <p class="label">Identité</p>
            <span v-if="props.board.currentUser.value" class="badge" :class="props.board.currentUser.value.role">
              {{ props.board.currentUser.value.role === 'administrateur' ? 'Administrateur' : 'Participant' }}
            </span>
          </header>
          <form v-if="!props.board.currentUser.value" class="identity-form" @submit.prevent="handleUserSubmit">
            <div class="form-field">
              <p class="form-field__label">Nom d'utilisateur</p>
              <input type="text" v-model="userName" placeholder="ex. PixelFan" />
            </div>
            <ul class="form-hint-list">
              <li>Entre 2 et 24 caractères</li>
            </ul>
            <div class="avatar-picker">
              <p class="avatar-picker__label">Choisis un avatar</p>
              <div class="avatar-picker__grid">
                <label
                  v-for="option in avatarOptions"
                  :key="option.id"
                  class="avatar-pill"
                  :class="{ 'avatar-pill--selected': selectedAvatar === option.id }"
                >
                  <input
                    type="radio"
                    name="avatar"
                    :value="option.id"
                    v-model="selectedAvatar"
                    :aria-label="`Avatar ${option.label}`"
                  />
                  <span class="avatar-pill__emoji">{{ option.emoji }}</span>
                  <span class="avatar-pill__text">
                    <strong>{{ option.label }}</strong>
                    <small>{{ option.description }}</small>
                  </span>
                </label>
              </div>
            </div>
            <label class="checkbox">
              <input type="checkbox" v-model="wantsAdmin" />
              Demander les droits administrateur
            </label>
            <p class="identity-card__hint">Rejoins la session pour poser des pixels.</p>
            <button class="primary" type="submit" :disabled="!props.board.isConnected.value">Rejoindre</button>
            <p v-if="props.board.userError.value" class="error">{{ props.board.userError.value }}</p>
          </form>
          <div v-else class="identity-summary">
            <div class="identity-summary__header">
              <span class="user-avatar user-avatar--xl">
                {{ resolveAvatar(props.board.currentUser.value.avatar).emoji }}
              </span>
              <div>
                <p class="identity-summary__name">{{ props.board.currentUser.value.name }}</p>
                <p class="identity-card__hint muted">
                  {{ resolveAvatar(props.board.currentUser.value.avatar).label }}
                </p>
              </div>
            </div>
            <p v-if="props.board.wasKicked.value" class="warning">
              Vous avez été déconnecté par un administrateur. Utilisez «&nbsp;Se reconnecter&nbsp;» pour revenir.
            </p>
          </div>
        </section>
      </div>
    </div>
    <!-- Admin-only connected users roster -->
    <div v-if="isAdmin" class="identity-panel__card">
      <div class="identity-panel__header">
        <h2>Utilisateurs connectés</h2>
        <span class="count">{{ props.board.users.value.length }}</span>
      </div>
      <ul class="users-list">
        <li v-for="user in props.board.users.value" :key="user.id" class="users-list__item">
          <div class="users-list__info">
            <span class="user-avatar" :title="resolveAvatar(user.avatar).label">
              {{ resolveAvatar(user.avatar).emoji }}
            </span>
            <div class="users-list__details">
              <span class="user-name">{{ user.name }}</span>
              <span class="badge" :class="user.role">
                {{ user.role === 'administrateur' ? 'Administrateur' : 'Participant' }}
              </span>
            </div>
          </div>
          <div v-if="props.board.currentUser.value?.id !== user.id && user.role !== 'administrateur'" class="users-list__actions">
            <button type="button" class="ghost danger" @click="handleKick(user.id)">
              Déconnecter
            </button>
          </div>
        </li>
        <li v-if="!props.board.users.value.length" class="users-list__empty">Aucun utilisateur pour le moment.</li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
/* Connection + identity layout */
.identity-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.identity-panel__card {
  flex: 1;
  min-width: 260px;
  padding: 1.5rem;
  border-radius: 1.25rem;
  background: var(--panel-bg);
  box-shadow: var(--panel-shadow);
  backdrop-filter: blur(18px);
}

.identity-panel__card h2 {
  margin-top: 0;
}

.identity-panel__card:only-child {
  flex-basis: 100%;
}

.identity-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.identity-card__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
}

.identity-card__block {
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.identity-card .label {
  font-size: 0.85rem;
  text-transform: uppercase;
  color: #94a3b8;
  margin: 0 0 0.35rem;
}

.identity-card__hint {
  margin: 0.35rem 0 0;
  color: #475569;
}

.identity-card__hint.muted {
  color: #94a3b8;
}

.connection-card {
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.04), rgba(99, 102, 241, 0.05));
}

.connection-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.connection-card__status {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  color: #0f172a;
}

.connection-card__status.online {
  color: #15803d;
}

.connection-card__status.offline {
  color: #c2410c;
}

.connection-card__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
}

.identity-block__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

button.ghost {
  padding: 0.6rem 1rem;
  border-radius: 999px;
  border: 1px solid #cbd5f5;
  background: transparent;
  color: #0f172a;
  cursor: pointer;
}

button.ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.error {
  margin-top: 0.5rem;
  color: #dc2626;
  font-size: 0.85rem;
}

.identity-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.identity-form input[type='text'] {
  width: 100%;
  border: 1px solid #cbd5f5;
  border-radius: 0.75rem;
  padding: 0.65rem 0.85rem;
  font-size: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.form-field__label {
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.form-hint-list {
  margin: 0;
  padding-left: 1.25rem;
  color: #94a3b8;
  font-size: 0.9rem;
}

.form-hint-list li {
  margin-bottom: 0.25rem;
}

.avatar-picker {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.avatar-picker__label {
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.avatar-picker__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.6rem;
}

.avatar-pill {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 0.85rem;
  padding: 0.6rem 0.75rem;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.avatar-pill input[type='radio'] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.avatar-pill--selected {
  border-color: rgba(59, 130, 246, 0.7);
  background: rgba(59, 130, 246, 0.08);
}

.avatar-pill__emoji {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.avatar-pill__text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.85rem;
}

.avatar-pill__text strong {
  font-size: 0.95rem;
  color: #0f172a;
}

.avatar-pill__text small {
  color: #64748b;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #0f172a;
}

.primary {
  padding: 0.65rem 1.5rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #38bdf8, #6366f1);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.identity-summary__header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 0.75rem;
}

.identity-summary__name {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.65rem;
  border-radius: 999px;
  font-size: 0.85rem;
  text-transform: capitalize;
  background: #e2e8f0;
  color: #0f172a;
}

.badge.administrateur {
  background: #fee2e2;
  color: #b91c1c;
}

.badge.participant {
  background: #e0f2fe;
  color: #0369a1;
}

.user-avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.user-avatar--xl {
  width: 3.25rem;
  height: 3.25rem;
  font-size: 1.8rem;
  background: rgba(15, 23, 42, 0.12);
}

.warning {
  margin-top: 0.5rem;
  color: #b45309;
  font-size: 0.9rem;
}

.identity-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.identity-panel__header h2 {
  margin: 0;
}

.count {
  font-weight: 700;
  color: #0ea5e9;
}

.users-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.users-list__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
}

.users-list__info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.users-list__details {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.users-list__actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-name {
  font-weight: 600;
}

.users-list__empty {
  color: #94a3b8;
  font-style: italic;
}

.ghost.danger {
  border-color: #fecaca;
  color: #b91c1c;
}
</style>
