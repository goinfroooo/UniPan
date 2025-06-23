import { describe, it, expect } from 'vitest'
import { ref, computed } from 'vue'

const grades = ['', '3', '4', '5', '6A', '6A+', '6B', '6B+', '6C', '6C+', '7A', '7A+', '7B', '7B+', '7C', '7C+', '8A', '8A+', '8B', '8B+', '8C', '8C+']
const gradeOrder = grades.reduce((acc, g, i) => { if (g) acc[g] = i; return acc }, {})

describe('BlocManager - filtrage et tri', () => {
  const blocs = ref([
    { id: '1', name: 'Bloc 1', grade: '6A' },
    { id: '2', name: 'Bloc 2', grade: '7A' },
    { id: '3', name: 'Bloc 3', grade: '5' },
    { id: '4', name: 'Bloc 4', grade: '8A' },
  ])
  const ratingsCache = ref({
    '1': { average: 3.5, count: 2 },
    '2': { average: 4.5, count: 4 },
    '3': { average: 2, count: 1 },
    '4': { average: 5, count: 10 },
  })
  const myAscents = ref({ '1': { status: 'sent' }, '2': { status: 'tried' } })

  function filterBlocs(minGrade, maxGrade) {
    let arr = [...blocs.value]
    if (minGrade && maxGrade) {
      const minIdx = gradeOrder[minGrade] || 0
      const maxIdx = gradeOrder[maxGrade] || grades.length
      arr = arr.filter(b => gradeOrder[b.grade] >= minIdx && gradeOrder[b.grade] <= maxIdx)
    } else if (minGrade) {
      const minIdx = gradeOrder[minGrade] || 0
      arr = arr.filter(b => gradeOrder[b.grade] >= minIdx)
    } else if (maxGrade) {
      const maxIdx = gradeOrder[maxGrade] || grades.length
      arr = arr.filter(b => gradeOrder[b.grade] <= maxIdx)
    }
    return arr
  }

  it('filtre les blocs dans une plage de cotation', () => {
    const filtered = filterBlocs('6A', '7A')
    expect(filtered.map(b => b.name)).toEqual(['Bloc 1', 'Bloc 2'])
  })

  it('filtre les blocs à partir d\'une cotation min', () => {
    const filtered = filterBlocs('7A', '')
    expect(filtered.map(b => b.name)).toEqual(['Bloc 2', 'Bloc 4'])
  })

  it('filtre les blocs jusqu\'à une cotation max', () => {
    const filtered = filterBlocs('', '6A')
    expect(filtered.map(b => b.name)).toEqual(['Bloc 1', 'Bloc 3'])
  })

  it('trie les blocs par nombre d\'étoiles décroissant', () => {
    let arr = [...blocs.value]
    arr.sort((a, b) => {
      const ra = ratingsCache.value[a.id]?.average || 0
      const rb = ratingsCache.value[b.id]?.average || 0
      return rb - ra
    })
    expect(arr.map(b => b.name)).toEqual(['Bloc 4', 'Bloc 2', 'Bloc 1', 'Bloc 3'])
  })
}) 