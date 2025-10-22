# UniBloc - Application Android

## 📱 À propos

UniBloc est une application mobile d'escalade qui permet aux grimpeurs de créer, visualiser et partager des blocs d'escalade. Cette version Android utilise Vue.js avec Capacitor pour offrir une expérience native.

## ✨ Fonctionnalités

- **Créateur de blocs** : Interface tactile pour définir les prises d'escalade
- **Système de cotation** : Support des cotations françaises et Vernon
- **Gestion des prises** : Types de prises (Début, Fin, Main, Pied) avec couleurs
- **Interface responsive** : Optimisée pour tous les écrans mobiles
- **Synchronisation** : Connexion avec l'API backend

## 🚀 Installation et démarrage rapide

### Option 1 : Script automatique
```bash
cd frontend
./build-android.sh
```

### Option 2 : Commandes manuelles
```bash
cd frontend
npm install
npm run build
npx cap sync
npx cap open android
```

## 📱 Utilisation

### Interface principale
- **Créer son bloc** : Sélectionnez les prises sur la grille 15x10
- **Blocs** : Consultez les blocs existants
- **Profil** : Gérez vos paramètres utilisateur

### Types de prises
- 🟢 **Vert (S)** : Prises de départ
- 🟣 **Violet (F)** : Prises d'arrivée  
- 🔵 **Bleu (M)** : Prises pour les mains
- 🟠 **Orange (P)** : Prises pour les pieds

### Règles de création
- Au moins 1 prise de départ (max 2)
- Au moins 1 prise d'arrivée (max 2)
- Nom du bloc obligatoire
- Cotation optionnelle

## 🔧 Configuration technique

### Technologies utilisées
- **Frontend** : Vue.js 3 + Vite
- **Mobile** : Capacitor 7
- **UI** : CSS responsive avec optimisations tactiles
- **API** : Intégration backend RESTful

### Optimisations mobiles
- Boutons tactiles optimisés
- Prévention du zoom automatique
- Suppression des highlights de tap
- Adaptation des tailles pour petits écrans
- Gestion des orientations d'écran

### Configuration réseau
- **Développement web** : `http://localhost:3001/api`
- **Émulateur Android** : `http://10.0.2.2:3001/api`
- **Production** : Configurable dans `src/App.vue`

## 📋 Prérequis système

- Node.js 18+ et npm
- Java JDK 17+
- Android Studio avec SDK Android
- Émulateur Android ou appareil physique

## 🛠️ Développement

### Structure du projet
```
frontend/
├── src/
│   ├── components/         # Composants Vue
│   ├── assets/            # Assets statiques
│   ├── App.vue            # Composant principal
│   └── main.js            # Point d'entrée
├── android/               # Projet Android natif
├── dist/                  # Build de production
├── capacitor.config.ts    # Configuration Capacitor
├── build-android.sh       # Script de construction
└── package.json           # Dépendances
```

### Commandes utiles
```bash
# Développement web
npm run dev

# Construction et synchronisation
npm run build && npx cap sync

# Lancement sur émulateur
npx cap run android

# Rechargement à chaud
npx cap run android --live-reload --external

# Ouvrir Android Studio
npx cap open android
```

## 🐛 Dépannage

### Problèmes fréquents

1. **Erreur de synchronisation**
   ```bash
   npx cap sync --force
   ```

2. **Problème Gradle**
   ```bash
   cd android && ./gradlew clean && ./gradlew build
   ```

3. **API non accessible**
   - Vérifier le serveur backend
   - Adapter l'URL dans `getApiUrl()`

4. **Problème d'émulateur**
   - Vérifier AVD Manager dans Android Studio
   - Redémarrer l'émulateur

## 📦 Distribution

### APK de développement
1. Ouvrir Android Studio
2. Build > Build Bundle(s) / APK(s) > Build APK(s)
3. APK généré dans `android/app/build/outputs/apk/debug/`

### APK de production
1. Configurer les clés de signature
2. Build > Generate Signed Bundle / APK
3. Suivre l'assistant Android Studio

## 🤝 Contribution

Pour contribuer au projet :
1. Fork le repository
2. Créer une branche feature
3. Développer et tester
4. Créer une pull request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation Capacitor
- Vérifier les logs Android avec `npx cap run android --log`

---

Made with ❤️ for the climbing community