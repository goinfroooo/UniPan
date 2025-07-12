import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { Capacitor } from '@capacitor/core'

const app = createApp(App)

// Configuration pour mobile
if (Capacitor.isNativePlatform()) {
  // Désactiver la sélection de texte sur mobile
  document.addEventListener('selectstart', function(e) {
    e.preventDefault()
  })
  
  // Désactiver le zoom
  document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
      e.preventDefault()
    }
  })
  
  // Désactiver le menu contextuel
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault()
  })
}

app.mount('#app')
