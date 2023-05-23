#!/bin/bash
# Définir les chemins vers les répertoires nécessaires
SCRIPT_BASE_DIR="/mnt/c/Users/Hugo/Documents/GitHub/Projet_CapChat/ScriptBaseIni"
IMAGE_DIR="/mnt/c/Users/Hugo/Documents/GitHub/Projet_CapChat/server/views/image"

echo "Début du script..."

# Supprimer tout le contenu du répertoire "image"
echo "Suppression du contenu du répertoire image..."
rm -rf "${IMAGE_DIR}"/*

# Copier les répertoires "neutres" et "singuliers" et le fichier "Indices_singuliers" du répertoire "ScriptBaseIni" vers "image"
echo "Copie des répertoires et fichiers vers image..."
cp -r "${SCRIPT_BASE_DIR}/neutres" "${IMAGE_DIR}/"
cp -r "${SCRIPT_BASE_DIR}/singuliers" "${IMAGE_DIR}/"
cp -r "${SCRIPT_BASE_DIR}/temp" "${IMAGE_DIR}/"
cp "${SCRIPT_BASE_DIR}/Indices_singuliers.txt" "${IMAGE_DIR}/"

#echo "Exécution de 1-Script-Base.js..."
#node 1-Script-Base.js

#echo "Exécution de 2-ScriptAjouteImageNeutre.js..."
#node 2-ScriptAjouteImageNeutre.js

#echo "Exécution de 3-ScriptAjouteImageSingulier.js..."
#node 3-ScriptAjouteImageSingulier.js

echo "Fin du script, toutes les étapes ont été réalisées avec succès !"
