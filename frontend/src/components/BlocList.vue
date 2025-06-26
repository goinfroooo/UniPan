<template>
  <div class="bloc-list">
    <h2>Liste des blocs</h2>
    <div v-if="loading">Chargement...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div v-if="blocs.length === 0">Aucun bloc trouvé.</div>
      <ul>
        <li v-for="bloc in blocs" :key="bloc._id" class="bloc-item">
          <div class="bloc-title">{{ bloc.name }}</div>
          <div class="bloc-desc">{{ bloc.description }}</div>
          <div class="bloc-grade">Cotation : {{ bloc.grade || 'N/A' }}</div>
          <div class="bloc-holds">
            Prises :
            <span v-for="hold in bloc.holds" :key="hold.num" :style="{ color: holdColor(hold.type), fontWeight: 'bold', marginRight: '0.5rem' }">
              {{ hold.num }}{{ hold.type }}
            </span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const blocs = ref([])
const loading = ref(true)
const error = ref('')

function holdColor(type) {
  return {
    'S': '#2ecc40', // vert
    'F': '#a259e6', // violet
    'M': '#3498db', // bleu
    'P': '#ff9800', // orange
    '': '#888'
  }[type] || '#888'
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('http://localhost:3001/api/blocs')
    if (!res.ok) throw new Error('Erreur lors du chargement des blocs')
    blocs.value = await res.json()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.bloc-list {
  max-width: 600px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  padding: 2rem;
}
.bloc-item {
  border-bottom: 1px solid #eee;
  padding: 1rem 0;
}
.bloc-title {
  font-weight: bold;
  font-size: 1.2rem;
}
.bloc-desc {
  color: #555;
  margin-bottom: 0.5rem;
}
.bloc-grade {
  color: #42b983;
  font-weight: bold;
}
.bloc-holds {
  font-size: 0.95rem;
  color: #888;
}
.error {
  color: #c00;
  margin-bottom: 1rem;
}
</style> 