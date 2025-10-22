# Guide de construction Android - UniBloc

## Prérequis

### Installation des outils nécessaires

1. **Java Development Kit (JDK)**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install openjdk-17-jdk
   
   # macOS
   brew install openjdk@17
   ```

2. **Android Studio**
   - Télécharger depuis https://developer.android.com/studio
   - Installer le SDK Android et les outils de construction
   - Configurer les variables d'environnement

3. **Variables d'environnement**
   ```bash
   # Ajouter dans ~/.bashrc ou ~/.zshrc
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

## Construction de l'application

### 1. Construire l'application web
```bash
cd frontend
npm run build
```

### 2. Synchroniser avec Android
```bash
npx cap sync
```

### 3. Ouvrir dans Android Studio
```bash
npx cap open android
```

### 4. Construire l'APK
Dans Android Studio :
- Aller dans **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**
- L'APK sera généré dans `android/app/build/outputs/apk/debug/`

## Déploiement

### Test sur émulateur
```bash
# Lancer l'émulateur
npx cap run android
```

### Installation sur appareil physique
1. Activer le mode développeur sur l'appareil
2. Activer le débogage USB
3. Connecter l'appareil
4. Installer l'APK :
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

## Configuration spécifique à l'application

### Permissions Android
L'application utilise les permissions suivantes (déjà configurées) :
- `INTERNET` : Pour les requêtes API
- `ACCESS_NETWORK_STATE` : Pour vérifier la connectivité

### Configuration réseau
L'application est configurée pour utiliser :
- `http://10.0.2.2:3001/api` pour l'émulateur Android
- `http://localhost:3001/api` pour le web

Pour changer l'URL de l'API en production, modifier la fonction `getApiUrl()` dans `src/App.vue`.

## Optimisations mobiles intégrées

### Interface utilisateur
- Boutons adaptés au tactile
- Grille optimisée pour les petits écrans
- Prévention du zoom automatique
- Suppression des highlights de tap

### Performance
- Désactivation de la sélection de texte
- Désactivation du menu contextuel
- Optimisation des tailles de police

## Dépannage

### Problèmes courants

1. **Erreur de construction Gradle**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew build
   ```

2. **Problème de synchronisation**
   ```bash
   npx cap sync --force
   ```

3. **Problème d'API**
   - Vérifier que le serveur backend fonctionne
   - Adapter l'URL dans `getApiUrl()` selon l'environnement

## Structure du projet Android

```
android/
├── app/
│   ├── src/main/
│   │   ├── assets/public/     # Assets web
│   │   ├── java/              # Code Java/Kotlin
│   │   ├── res/               # Ressources Android
│   │   └── AndroidManifest.xml
│   └── build.gradle
├── gradle/
└── build.gradle
```

## Commandes utiles

```bash
# Reconstruire et synchroniser
npm run build && npx cap sync

# Lancer en mode développement
npx cap run android --live-reload --external

# Voir les logs
npx cap run android --device --log

# Mise à jour des plugins Capacitor
npm update @capacitor/core @capacitor/cli @capacitor/android
```