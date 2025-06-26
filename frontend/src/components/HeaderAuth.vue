<template>
  <header style="width: 100%; background: #222; color: #fff; padding: 1rem 0; display: flex; justify-content: space-between; align-items: center;">
    <div style="font-size: 1.5rem; font-weight: bold; margin-left: 2rem;">UniPan</div>
    <div style="margin-right: 2rem; display: flex; align-items: center;">
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
</style> 