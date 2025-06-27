<template>
  <header :class="['header', { 'header-large': tab === 'blocs' }]">
    <div class="logo">Unibloc</div>
    <nav class="nav">
      <button :class="{active: tab==='create'}" @click="$emit('changeTab', 'create')">Créer un bloc</button>
      <button :class="{active: tab==='blocs'}" @click="$emit('changeTab', 'blocs')">Voir les blocs</button>
      <button v-if="isConnected" :class="{active: tab==='profile'}" @click="$emit('changeTab', 'profile')">Profil</button>
      <button v-if="isConnected" class="logout" @click="$emit('logout')">Déconnexion</button>
    </nav>
  </header>
</template>

<script setup>
const props = defineProps({
  tab: String,
  isConnected: Boolean
})
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 64px;
  background: #fff;
  color: var(--unibloc-dark);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1000;
  box-shadow: var(--unibloc-shadow);
  padding: 0 2rem;
  transition: height 0.3s;
}
.header-large {
  height: 110px;
  align-items: flex-end;
  padding-bottom: 1.5rem;
}
.logo {
  font-size: 2rem;
  font-weight: bold;
  letter-spacing: 2px;
  color: var(--unibloc-orange);
  font-family: 'Montserrat', 'Inter', Arial, sans-serif;
}
.nav {
  display: flex;
  gap: 1rem;
}
button {
  background: var(--unibloc-orange);
  color: #fff;
  border: none;
  border-radius: var(--unibloc-radius);
  font-size: 1rem;
  padding: 0.5em 1.2em;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  box-shadow: none;
  transition: background 0.2s, color 0.2s;
}
button.active, button:hover, button:focus {
  background: #fff;
  color: var(--unibloc-orange);
  border: 2px solid var(--unibloc-orange);
}
button.logout {
  color: #fff;
  background: #c0392b;
  border: none;
}
button.logout:hover, button.logout:focus {
  background: #fff;
  color: #c0392b;
  border: 2px solid #c0392b;
}
</style> 