<template>
  <header style="width: 100%; background: #222; color: #fff; padding: 1rem 0; display: flex; justify-content: space-between; align-items: center;">
    <div style="font-size: 1.5rem; font-weight: bold; margin-left: 2rem;">UniPan</div>
    <!-- Menu desktop -->
    <div class="menu-desktop" style="margin-right: 2rem; display: flex; align-items: center;">
      <template v-if="user">
        <img v-if="user.avatar" :src="user.avatar" alt="avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 1rem;" />
        <span style="margin-right: 1rem; font-weight: bold;">{{ user.pseudo }}</span>
        <button @click="$emit('show-profile')" style="margin-right: 1rem;">Profil</button>
        <button @click="logout">Se déconnecter</button>
      </template>
      <template v-else>
        <button @click="showLogin = true" style="margin-right: 1rem;">Se connecter</button>
        <button @click="showRegister = true">Créer un compte</button>
      </template>
    </div>
    <!-- Menu mobile -->
    <div class="menu-mobile" style="margin-right: 2rem; display: none; align-items: center; position: relative;">
      <button @click="showMobileMenu = !showMobileMenu" class="menu-btn" aria-label="Menu">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <div v-if="showMobileMenu" class="dropdown-menu">
        <template v-if="user">
          <div class="dropdown-item" style="display:flex;align-items:center;gap:0.5em;">
            <img v-if="user.avatar" :src="user.avatar" alt="avatar" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
            <span style="font-weight: bold;">{{ user.pseudo }}</span>
          </div>
          <button class="dropdown-item" @click="$emit('show-profile'); showMobileMenu=false">Profil</button>
          <button class="dropdown-item" @click="logout; showMobileMenu=false">Se déconnecter</button>
        </template>
        <template v-else>
          <button class="dropdown-item" @click="showLogin = true; showMobileMenu=false">Se connecter</button>
          <button class="dropdown-item" @click="showRegister = true; showMobileMenu=false">Créer un compte</button>
        </template>
      </div>
    </div>
    <!-- Modals -->
    <div v-if="showLogin" class="modal-bg" @click.self="showLogin = false">
      <div class="modal">
        <h2>Connexion</h2>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label>Email</label>
            <input v-model="loginEmail" type="email" required />
          </div>
          <div class="form-group">
            <label>Mot de passe</label>
            <input v-model="loginPassword" type="password" required />
          </div>
          <div v-if="loginError" class="error">{{ loginError }}</div>
          <button type="submit">Se connecter</button>
        </form>
        <button @click="showLogin = false" style="margin-top: 1rem;">Fermer</button>
      </div>
    </div>
    <div v-if="showRegister" class="modal-bg" @click.self="showRegister = false">
      <div class="modal">
        <h2>Créer un compte</h2>
        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label>Email</label>
            <input v-model="registerEmail" type="email" required />
          </div>
          <div class="form-group">
            <label>Mot de passe</label>
            <input v-model="registerPassword" type="password" required />
          </div>
          <div class="form-group">
            <label>Pseudo</label>
            <input v-model="registerPseudo" type="text" required />
          </div>
          <div class="form-group">
            <label>Image de profil (URL)</label>
            <input v-model="registerAvatar" type="url" placeholder="https://..." />
          </div>
          <div class="form-group">
            <label><input type="checkbox" v-model="registerConsent" required /> J'accepte la politique de confidentialité</label>
          </div>
          <div v-if="registerError" class="error">{{ registerError }}</div>
          <button type="submit">Créer un compte</button>
        </form>
        <button @click="showRegister = false" style="margin-top: 1rem;">Fermer</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const showLogin = ref(false)
const showRegister = ref(false)
const showMobileMenu = ref(false)

// État utilisateur connecté
const user = ref(null)

function fetchUser() {
  const token = localStorage.getItem('token')
  if (!token) {
    user.value = null
    return
  }
  fetch('http://localhost:3001/api/me', {
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .then(async res => {
      if (!res.ok) throw new Error('Session expirée')
      return res.json()
    })
    .then(data => {
      user.value = data
    })
    .catch(() => {
      user.value = null
      localStorage.removeItem('token')
    })
}

onMounted(fetchUser)

// Connexion
const loginEmail = ref('')
const loginPassword = ref('')
const loginError = ref('')
function handleLogin() {
  loginError.value = ''
  if (!loginEmail.value || !loginPassword.value) {
    loginError.value = 'Veuillez remplir tous les champs.'
    return
  }
  fetch('http://localhost:3001/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: loginEmail.value, password: loginPassword.value })
  })
    .then(async res => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erreur inconnue')
      }
      return res.json()
    })
    .then(data => {
      localStorage.setItem('token', data.token)
      showLogin.value = false
      loginEmail.value = ''
      loginPassword.value = ''
      loginError.value = ''
      user.value = { pseudo: data.pseudo, avatar: data.avatar, role: data.role }
      fetchUser()
    })
    .catch(err => {
      loginError.value = err.message
    })
}

// Inscription
const registerEmail = ref('')
const registerPassword = ref('')
const registerPseudo = ref('')
const registerAvatar = ref('')
const registerConsent = ref(false)
const registerError = ref('')
function handleRegister() {
  registerError.value = ''
  if (!registerEmail.value || !registerPassword.value || !registerPseudo.value || !registerConsent.value) {
    registerError.value = 'Veuillez remplir tous les champs et accepter la politique.'
    return
  }
  fetch('http://localhost:3001/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: registerEmail.value, password: registerPassword.value, pseudo: registerPseudo.value, avatar: registerAvatar.value, consent: true })
  })
    .then(async res => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erreur inconnue')
      }
      return res.json()
    })
    .then(data => {
      showRegister.value = false
      registerEmail.value = ''
      registerPassword.value = ''
      registerPseudo.value = ''
      registerAvatar.value = ''
      registerConsent.value = false
      registerError.value = ''
      // Optionnel : ouvrir la modale de connexion
      showLogin.value = true
    })
    .catch(err => {
      registerError.value = err.message
    })
}

function logout() {
  localStorage.removeItem('token')
  user.value = null
}
</script>

<style scoped>
button {
  background: #42b983;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}
button:hover {
  background: #369870;
}
.modal-bg {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #fff;
  color: #222;
  padding: 2rem;
  border-radius: 8px;
  min-width: 300px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.2);
}
.form-group {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
input[type="email"], input[type="password"] {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  margin-top: 0.25rem;
}
.error {
  color: #c00;
  margin-bottom: 1rem;
}
.menu-desktop {
  display: flex;
}
.menu-mobile {
  display: none;
}
@media (max-width: 700px) {
  .menu-desktop {
    display: none !important;
  }
  .menu-mobile {
    display: flex !important;
  }
}
.menu-btn {
  background: none;
  border: none;
  color: #fff;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
}
.dropdown-menu {
  position: absolute;
  top: 48px;
  right: 0;
  background: #222;
  border-radius: 8px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.2);
  min-width: 180px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  padding: 0.5em 0;
}
.dropdown-item {
  background: none;
  border: none;
  color: #fff;
  text-align: left;
  padding: 0.75em 1.5em;
  font-size: 1rem;
  cursor: pointer;
  width: 100%;
}
.dropdown-item:hover {
  background: #333;
}
</style> 