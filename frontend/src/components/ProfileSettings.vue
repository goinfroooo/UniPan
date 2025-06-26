<template>
  <div v-if="user" class="profile-settings">
    <h2>Paramètres du profil</h2>
    <form @submit.prevent="updateProfile">
      <div class="form-group">
        <label>Pseudo</label>
        <input v-model="pseudo" type="text" required />
      </div>
      <div class="form-group">
        <label>Image de profil</label>
        <input type="file" accept="image/*" @change="onFileChange" />
      </div>
      <div class="form-group">
        <img v-if="avatar" :src="avatar" alt="avatar" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-top: 0.5rem;" />
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="success" class="success">{{ success }}</div>
      <button type="submit">Enregistrer</button>
    </form>
  </div>
  <div v-else class="profile-settings">
    <h2>Veuillez vous connecter pour accéder à vos paramètres de profil.</h2>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const user = ref(null)
const pseudo = ref('')
const avatar = ref('')
const error = ref('')
const success = ref('')

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
      pseudo.value = data.pseudo || ''
      avatar.value = data.avatar || ''
    })
    .catch(() => {
      user.value = null
      localStorage.removeItem('token')
    })
}

onMounted(fetchUser)

async function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const token = localStorage.getItem('token')
  const formData = new FormData()
  formData.append('avatar', file)
  error.value = ''
  success.value = ''
  try {
    const res = await fetch('http://localhost:3001/api/upload/avatar', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Erreur lors de l\'upload')
    }
    const data = await res.json()
    avatar.value = 'http://localhost:3001' + data.url
    success.value = 'Image uploadée !'
  } catch (err) {
    error.value = err.message
  }
}

function updateProfile() {
  error.value = ''
  success.value = ''
  const token = localStorage.getItem('token')
  if (!token) {
    error.value = 'Non authentifié.'
    return
  }
  fetch('http://localhost:3001/api/me', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ pseudo: pseudo.value, avatar: avatar.value })
  })
    .then(async res => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erreur inconnue')
      }
      return res.json()
    })
    .then(data => {
      success.value = 'Profil mis à jour !'
      fetchUser()
    })
    .catch(err => {
      error.value = err.message
    })
}
</script>

<style scoped>
.profile-settings {
  max-width: 400px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  padding: 2rem;
}
.form-group {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
input[type="text"], input[type="url"] {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  margin-top: 0.25rem;
}
button {
  background: #42b983;
  color: #fff;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}
button:hover {
  background: #369870;
}
.error {
  color: #c00;
  margin-bottom: 1rem;
}
.success {
  color: #2d8a34;
  margin-bottom: 1rem;
}
</style> 