<script setup>
import { ref } from 'vue'

const rows = 15
const cols = 10
const total = rows * cols
const selected = ref(new Set())

function toggleHold(num) {
  if (selected.value.has(num)) {
    selected.value.delete(num)
  } else {
    selected.value.add(num)
  }
  // Pour forcer la réactivité de Set
  selected.value = new Set(selected.value)
}
</script>

<template>
  <div style="display: flex; flex-direction: column; align-items: center; margin-top: 2rem;">
    <h1>Pan d'escalade</h1>
    <div style="display: grid; grid-template-columns: repeat(10, 40px); gap: 8px;">
      <button
        v-for="num in total"
        :key="num"
        :style="{
          background: selected.has(num) ? '#42b983' : '#eee',
          color: selected.has(num) ? 'white' : 'black',
          border: '1px solid #ccc',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          fontWeight: 'bold',
          cursor: 'pointer',
        }"
        @click="toggleHold(num)"
      >
        {{ num }}
      </button>
    </div>
    <div style="margin-top: 2rem;">
      <h2>Prises sélectionnées :</h2>
      <div>{{ Array.from(selected).sort((a,b)=>a-b).join(', ') || 'Aucune' }}</div>
    </div>
  </div>
</template>

<style scoped>
button:focus {
  outline: 2px solid #42b983;
}
</style>
