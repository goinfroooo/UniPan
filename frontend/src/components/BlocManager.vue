<script setup>
import { ref, watch, computed } from 'vue'

const API_URL = 'http://localhost:3001/api'

const name = ref('')
const description = ref('')
const grade = ref('')
const message = ref('')
const blocs = ref([])
const selectedBloc = ref(null)
const favorites = ref([])
const user = ref(null)
const token = ref(localStorage.getItem('token') || '')
const role = ref('user')
const grades = [
  '', '3', '4', '5', '6A', '6A+', '6B', '6B+', '6C', '6C+', '7A', '7A+', '7B', '7B+', '7C', '7C+', '8A', '8A+', '8B', '8B+', '8C', '8C+'
]
const gradeOrder = grades.reduce((acc, g, i) => { if (g) acc[g] = i; return acc }, {})

const ratingsCache = ref({}) // { blocId: { average, count } }
const myRatings = ref({}) // { blocId: note }
const myAscents = ref({}) // { blocId: { status, attempts } }

const sortBy = ref('default')
const minGrade = ref('')
const maxGrade = ref('')

const props = defineProps({
  selected: Set,
  setSelected: Function
})

async function fetchBlocs() {
  const res = await fetch(API_URL + '/blocs')
  if (res.ok) {
    blocs.value = await res.json()
    // Pour chaque bloc, fetch la moyenne des notes
    for (const bloc of blocs.value) {
      fetchRatings(bloc)
      if (bloc.ratings && user.value) {
        const my = bloc.ratings.find(r => r.userId === user.value.id)
        if (my) myRatings.value[bloc.id] = my.rating
      }
    }
  }
}

async function fetchRatings(bloc) {
  const res = await fetch(`${API_URL}/blocs/${bloc.id}/ratings`)
  if (res.ok) {
    ratingsCache.value[bloc.id] = await res.json()
  }
}

async function fetchUser() {
  if (!token.value) {
    user.value = null
    role.value = 'user'
    favorites.value = []
    myAscents.value = {}
    return
  }
  const res = await fetch(API_URL + '/me', {
    headers: { Authorization: 'Bearer ' + token.value }
  })
  if (res.ok) {
    const data = await res.json()
    user.value = data
    role.value = data.role
    favorites.value = data.favorites || []
    await fetchAscents()
  } else {
    user.value = null
    role.value = 'user'
    favorites.value = []
    myAscents.value = {}
  }
}

async function fetchAscents() {
  if (!token.value) return
  const res = await fetch(API_URL + '/me/ascents', {
    headers: { Authorization: 'Bearer ' + token.value }
  })
  if (res.ok) {
    const data = await res.json()
    myAscents.value = {}
    for (const a of data.ascents) {
      myAscents.value[a.blocId] = { status: a.status, attempts: a.attempts }
    }
  }
}

async function createBloc() {
  message.value = ''
  if (!name.value || !props.selected.size) {
    message.value = 'Nom et prises obligatoires.'
    return
  }
  const res = await fetch(API_URL + '/blocs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name.value,
      description: description.value,
      holds: Array.from(props.selected),
      grade: grade.value
    })
  })
  const data = await res.json()
  if (res.ok) {
    message.value = 'Bloc créé !'
    name.value = ''
    description.value = ''
    grade.value = ''
    props.setSelected(new Set())
    await fetchBlocs()
  } else {
    message.value = data.error || 'Erreur lors de la création.'
  }
}

function showBloc(bloc) {
  selectedBloc.value = bloc
  props.setSelected(new Set(bloc.holds))
}

async function deleteBloc(bloc) {
  if (!confirm('Supprimer ce bloc ?')) return
  const res = await fetch(API_URL + '/blocs/' + bloc.id, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token.value }
  })
  if (res.ok) {
    message.value = 'Bloc supprimé.'
    await fetchBlocs()
    await fetchUser()
    if (selectedBloc.value && selectedBloc.value.id === bloc.id) {
      selectedBloc.value = null
      props.setSelected(new Set())
    }
  } else {
    const data = await res.json()
    message.value = data.error || 'Erreur lors de la suppression.'
  }
}

function isFavorite(bloc) {
  return favorites.value.includes(bloc.id)
}

async function addFavorite(bloc) {
  const res = await fetch(API_URL + '/me/favorites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token.value
    },
    body: JSON.stringify({ blocId: bloc.id })
  })
  if (res.ok) {
    const data = await res.json()
    favorites.value = data.favorites
  }
}

async function removeFavorite(bloc) {
  const res = await fetch(API_URL + '/me/favorites/' + bloc.id, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token.value }
  })
  if (res.ok) {
    const data = await res.json()
    favorites.value = data.favorites
  }
}

async function rateBloc(bloc, note) {
  if (!user.value) return
  const res = await fetch(`${API_URL}/blocs/${bloc.id}/rate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token.value
    },
    body: JSON.stringify({ rating: note })
  })
  if (res.ok) {
    myRatings.value[bloc.id] = note
    await fetchRatings(bloc)
  }
}

// Ascents
async function setAscent(bloc, status, attempts = 1) {
  if (!user.value) return
  const res = await fetch(`${API_URL}/me/ascents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token.value
    },
    body: JSON.stringify({ blocId: bloc.id, status, attempts })
  })
  if (res.ok) {
    await fetchAscents()
  }
}

async function removeAscent(bloc) {
  if (!user.value) return
  const res = await fetch(`${API_URL}/me/ascents/${bloc.id}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token.value }
  })
  if (res.ok) {
    await fetchAscents()
  }
}

const filteredBlocs = computed(() => {
  let arr = [...blocs.value]
  // Filtre plage de cotation
  if (minGrade.value && maxGrade.value) {
    const minIdx = gradeOrder[minGrade.value] || 0
    const maxIdx = gradeOrder[maxGrade.value] || grades.length
    arr = arr.filter(b => gradeOrder[b.grade] >= minIdx && gradeOrder[b.grade] <= maxIdx)
  } else if (minGrade.value) {
    const minIdx = gradeOrder[minGrade.value] || 0
    arr = arr.filter(b => gradeOrder[b.grade] >= minIdx)
  } else if (maxGrade.value) {
    const maxIdx = gradeOrder[maxGrade.value] || grades.length
    arr = arr.filter(b => gradeOrder[b.grade] <= maxIdx)
  }
  return arr
})

const sortedBlocs = computed(() => {
  let arr = [...filteredBlocs.value]
  if (sortBy.value === 'stars') {
    arr.sort((a, b) => {
      const ra = ratingsCache.value[a.id]?.average || 0
      const rb = ratingsCache.value[b.id]?.average || 0
      return rb - ra
    })
  } else if (sortBy.value === 'not-sent') {
    arr.sort((a, b) => {
      const sa = myAscents.value[a.id]?.status === 'sent' ? 1 : 0
      const sb = myAscents.value[b.id]?.status === 'sent' ? 1 : 0
      return sa - sb // non validés d'abord
    })
  } else if (sortBy.value === 'sent') {
    arr.sort((a, b) => {
      const sa = myAscents.value[a.id]?.status === 'sent' ? 1 : 0
      const sb = myAscents.value[b.id]?.status === 'sent' ? 1 : 0
      return sb - sa // validés d'abord
    })
  }
  return arr
})

watch(selectedBloc, (bloc) => {
  if (!bloc) props.setSelected(new Set())
})

watch(token, () => {
  fetchUser()
})

fetchBlocs()
fetchUser()
</script>

<template>
  <div class="bloc-manager">
    <h2>Créer un bloc</h2>
    <form @submit.prevent="createBloc">
      <input v-model="name" placeholder="Nom du bloc" required />
      <input v-model="description" placeholder="Description (optionnelle)" />
      <select v-model="grade">
        <option v-for="g in grades" :key="g" :value="g">{{ g || 'Cotation' }}</option>
      </select>
      <button type="submit">Créer</button>
    </form>
    <div class="error" v-if="message">{{ message }}</div>
    <div class="sort-menu">
      <label>Filtrer par niveau :</label>
      <select v-model="minGrade">
        <option value="">Min</option>
        <option v-for="g in grades.slice(1)" :key="g" :value="g">{{ g }}</option>
      </select>
      <span>à</span>
      <select v-model="maxGrade">
        <option value="">Max</option>
        <option v-for="g in grades.slice(1)" :key="g" :value="g">{{ g }}</option>
      </select>
      <label style="margin-left:1em;">Trier par :</label>
      <select v-model="sortBy">
        <option value="default">Ordre d'ajout</option>
        <option value="stars">Nombre d'étoiles</option>
        <option value="not-sent">Non validés d'abord</option>
        <option value="sent">Validés d'abord</option>
      </select>
    </div>
    <h2 style="margin-top:2em;">Blocs existants</h2>
    <ul>
      <li v-for="bloc in sortedBlocs" :key="bloc.id">
        <a href="#" @click.prevent="showBloc(bloc)">{{ bloc.name }}</a>
        <span v-if="bloc.description"> - {{ bloc.description }}</span>
        <span v-if="bloc.grade" style="color: #42b983; font-weight: bold;"> [{{ bloc.grade }}]</span>
        <span style="color: #888;"> ({{ bloc.holds.length }} prises)</span>
        <span v-if="ratingsCache[bloc.id] && ratingsCache[bloc.id].count">
          — <span title="Moyenne des notes">{{ ratingsCache[bloc.id].average.toFixed(1) }}★</span>
          <span style="color:#aaa;">({{ ratingsCache[bloc.id].count }})</span>
        </span>
        <template v-if="user">
          <button v-if="!isFavorite(bloc)" @click="addFavorite(bloc)">☆ Favori</button>
          <button v-else @click="removeFavorite(bloc)">★ Retirer</button>
          <button v-if="role === 'admin'" @click="deleteBloc(bloc)" style="color: red;">Supprimer</button>
          <span style="margin-left:1em;">
            <span v-for="n in 5" :key="n" @click="rateBloc(bloc, n)" style="cursor:pointer; font-size:1.2em; user-select:none;">
              <span :style="myRatings[bloc.id] >= n ? 'color:gold' : 'color:#bbb'">★</span>
            </span>
          </span>
          <!-- Ascents UI -->
          <span style="margin-left:1em;">
            <template v-if="myAscents[bloc.id]">
              <span v-if="myAscents[bloc.id].status === 'sent'" style="color:green; font-weight:bold;">Validé</span>
              <span v-else-if="myAscents[bloc.id].status === 'tried'" style="color:#888;">Tenté : {{ myAscents[bloc.id].attempts }} essai(s)</span>
              <button @click="removeAscent(bloc)" style="margin-left:0.5em;">Retirer</button>
            </template>
            <template v-else>
              <button @click="setAscent(bloc, 'sent', 1)">Validé</button>
              <input type="number" min="1" v-model.number="myAscents[bloc.id+'_input']" style="width:3em; margin-left:0.5em;" placeholder="Essais" />
              <button @click="setAscent(bloc, 'tried', myAscents[bloc.id+'_input'] || 1)">Tenté</button>
            </template>
          </span>
        </template>
      </li>
    </ul>
    <div v-if="user && favorites.length">
      <h2 style="margin-top:2em;">Mes blocs favoris</h2>
      <ul>
        <li v-for="blocId in favorites" :key="blocId">
          <span v-if="blocs.find(b => b.id === blocId)">
            <a href="#" @click.prevent="showBloc(blocs.find(b => b.id === blocId))">
              {{ blocs.find(b => b.id === blocId).name }}
            </a>
          </span>
          <span v-else style="color: #888;">Bloc supprimé</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.bloc-manager {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #f8f8f8;
}
input, select {
  display: block;
  width: 100%;
  margin-bottom: 1em;
  padding: 0.5em;
  border-radius: 4px;
  border: 1px solid #bbb;
}
button {
  margin-bottom: 1em;
  margin-right: 0.5em;
}
.sort-menu {
  margin-bottom: 1em;
  display: flex;
  align-items: center;
  gap: 0.5em;
}
.error {
  color: red;
  margin-bottom: 1em;
}
ul {
  padding-left: 1em;
}
li {
  margin-bottom: 0.5em;
}
</style> 