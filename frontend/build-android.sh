#!/bin/bash

# Script de construction Android pour UniBloc
# Usage: ./build-android.sh [--run | --open | --build-only]

set -e

echo "🚀 Construction de l'application Android UniBloc"
echo "================================================="

# Vérifier les dépendances
echo "📦 Vérification des dépendances..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez installer Node.js."
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo "❌ npx n'est pas installé. Veuillez installer Node.js."
    exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Construire l'application web
echo "🔨 Construction de l'application web..."
npm run build

# Synchroniser avec Capacitor
echo "🔄 Synchronisation avec Capacitor..."
npx cap sync

# Traiter les arguments
case "$1" in
    "--run")
        echo "▶️  Lancement sur émulateur Android..."
        npx cap run android
        ;;
    "--open")
        echo "🎯 Ouverture dans Android Studio..."
        npx cap open android
        ;;
    "--build-only")
        echo "✅ Construction terminée. Fichiers prêts pour Android Studio."
        ;;
    "")
        echo "🎯 Ouverture dans Android Studio..."
        npx cap open android
        ;;
    *)
        echo "❌ Argument inconnu: $1"
        echo "Usage: $0 [--run | --open | --build-only]"
        echo "  --run        : Lance l'application sur l'émulateur"
        echo "  --open       : Ouvre Android Studio (défaut)"
        echo "  --build-only : Construit seulement, n'ouvre pas Android Studio"
        exit 1
        ;;
esac

echo ""
echo "✅ Terminé !"
echo ""
echo "📱 Pour construire l'APK dans Android Studio :"
echo "   Build > Build Bundle(s) / APK(s) > Build APK(s)"
echo ""
echo "🔧 Fichiers générés :"
echo "   - Application web : ./dist/"
echo "   - Projet Android : ./android/"
echo ""
echo "🌐 Configuration API :"
echo "   - Web : http://localhost:3001/api"
echo "   - Android : http://10.0.2.2:3001/api"
echo ""