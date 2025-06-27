<script setup>
import { ref } from 'vue'
import HeaderAuth from './components/HeaderAuth.vue'
import ProfileSettings from './components/ProfileSettings.vue'
import BlocList from './components/BlocList.vue'

const rows = 15
const cols = 10
const total = rows * cols

// Prises sélectionnées : { [num]: type } où type = '', 'S', 'F', 'M', 'P'
const holdTypes = ['', 'S', 'F', 'M', 'P']
const holdColors = {
  '': '#eee',
  'S': '#2ecc40', // vert
  'F': '#a259e6', // violet
  'M': '#3498db', // bleu
  'P': '#ff9800', // orange
}
const holdLabels = {
  '': '',
  'S': 'Début',
  'F': 'Fin',
  'M': 'Main',
  'P': 'Pied',
}
const selected = ref({}) // { num: type }

const showProfile = ref(false)
const showBlocs = ref(false)

// Champs pour la création de bloc
const blocName = ref('')
const blocDescription = ref('')
const blocGrade = ref('')
const createError = ref('')
const createSuccess = ref('')

// Cotations françaises et Vernon
const grades = [
  '',
  '3/VB', '3+/VB+',
  '4/V0', '4+/V0+',
  '5a/V1', '5a+/V1+', '5b/V2', '5b+/V2+', '5c/V2+',
  '6a/V3', '6a+/V3+', '6b/V4', '6b+/V4+', '6c/V5', '6c+/V5+',
  '7a/V6', '7a+/V6+', '7b/V7', '7b+/V7+', '7c/V8', '7c+/V8+',
  '8a/V9', '8a+/V10', '8b/V11', '8b+/V12', '8c/V13', '8c+/V14',
]

function toggleHold(num) {
  const current = selected.value[num] || ''
  const idx = holdTypes.indexOf(current)
  const nextType = holdTypes[(idx + 1) % holdTypes.length]
  if (nextType === '') {
    // On retire la prise si retour à neutre
    const copy = { ...selected.value }
    delete copy[num]
    selected.value = copy
  } else {
    selected.value = { ...selected.value, [num]: nextType }
  }
}

async function createBloc() {
  createError.value = ''
  createSuccess.value = ''
  const holdsArr = Object.entries(selected.value).map(([num, type]) => ({ num: Number(num), type }))
  if (!blocName.value || holdsArr.length === 0) {
    createError.value = 'Nom et au moins une prise obligatoires.'
    return
  }
  // Vérification des prises de départ et d'arrivée
  const nbStart = holdsArr.filter(h => h.type === 'S').length
  const nbEnd = holdsArr.filter(h => h.type === 'F').length
  if (nbStart < 1 || nbEnd < 1) {
    createError.value = 'Il faut au moins une prise de départ (verte) et une d\'arrivée (violette).'
    return
  }
  if (nbStart > 2 || nbEnd > 2) {
    createError.value = 'Il ne peut pas y avoir plus de 2 prises de départ (vertes) ou d\'arrivée (violettes).'
    return
  }
  try {
    const res = await fetch('http://localhost:3001/api/blocs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: blocName.value,
        description: blocDescription.value,
        holds: holdsArr,
        grade: blocGrade.value
      })
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Erreur lors de la création du bloc')
    }
    createSuccess.value = 'Bloc créé avec succès !'
    blocName.value = ''
    blocDescription.value = ''
    blocGrade.value = ''
    selected.value = {}
  } catch (err) {
    createError.value = err.message
  }
}
</script>

<template>
  <div class="main-container">
    <HeaderAuth @show-profile="showProfile = true" :tab="showBlocs ? 'blocs' : (showProfile ? 'profile' : 'create')" />
    <div class="menu-bar">
      <button @click="showBlocs = false; showProfile = false">Créer son bloc</button>
      <button @click="showBlocs = true; showProfile = false">Blocs</button>
    </div>
    <div v-if="showProfile" class="card">
      <ProfileSettings />
      <button @click="showProfile = false" class="btn-retour">Retour</button>
    </div>
    <div v-else-if="showBlocs" class="card">
      <BlocList />
    </div>
    <div v-else class="card create-bloc">
      <h1>Créer un bloc d'escalade</h1>
      <form @submit.prevent="createBloc">
        <div class="form-group">
          <label>Nom du bloc *</label>
          <input v-model="blocName" type="text" required />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea v-model="blocDescription" rows="2" />
        </div>
        <div class="form-group">
          <label>Cotation</label>
          <select v-model="blocGrade">
            <option v-for="g in grades" :key="g" :value="g" :disabled="g === ''">{{ g || 'Choisir une cotation' }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Prises sélectionnées *</label>
          <div class="selected-holds">
            <span v-for="(type, num) in selected" :key="num">
              {{ num }}<span v-if="type">{{ type }}</span>
              <span v-if="type" :style="{ color: holdColors[type], fontWeight: 'bold', marginLeft: '2px' }">({{ holdLabels[type] }})</span>
            </span>
            <span v-if="Object.keys(selected).length === 0">Aucune</span>
          </div>
        </div>
        <div v-if="createError" class="error">{{ createError }}</div>
        <div v-if="createSuccess" class="success">{{ createSuccess }}</div>
        <button type="submit">Créer le bloc</button>
      </form>
      <div class="holds-grid">
        <button
          v-for="num in total"
          :key="num"
          class="hold-btn"
          :style="{
            background: holdColors[selected[num] || ''],
            color: selected[num] ? 'white' : 'black',
            border: '1px solid #ccc',
          }"
          @click="toggleHold(num)"
        >
          <span class="hold-num">{{ num }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-container {
  margin-top: 80px;
  padding: 2rem 0;
  min-height: 100vh;
  background: var(--unibloc-grey);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.menu-bar {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.card {
  width: 100%;
  max-width: 500px;
  background: #fff;
  border-radius: var(--unibloc-radius);
  box-shadow: var(--unibloc-shadow);
  padding: 2.5rem 2rem;
  margin-bottom: 2rem;
}
.create-bloc h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--unibloc-orange);
  font-size: 2rem;
  font-family: 'Montserrat', 'Inter', Arial, sans-serif;
}
.holds-grid {
  display: grid;
  grid-template-columns: repeat(10, 40px);
  gap: 8px;
  justify-content: center;
  margin-top: 2rem;
}
.selected-holds {
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}
.btn-retour {
  display: block;
  margin: 2rem auto 0 auto;
  background: #fff;
  color: var(--unibloc-orange);
  border: 2px solid var(--unibloc-orange);
  font-weight: 600;
}
.btn-retour:hover, .btn-retour:focus {
  background: var(--unibloc-orange);
  color: #fff;
}
.error {
  color: #c0392b;
  margin-bottom: 1rem;
  font-weight: bold;
}
.success {
  color: #2d8a34;
  margin-bottom: 1rem;
  font-weight: bold;
}
.hold-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-weight: bold;
  font-size: 1rem;
  padding: 0;
  margin: 0;
}
.hold-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
