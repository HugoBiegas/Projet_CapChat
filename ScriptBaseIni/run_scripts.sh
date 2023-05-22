#!/bin/bash
# Définir les chemins vers les répertoires nécessaires
SCRIPT_BASE_DIR="C:\Users\Hugo\Documents\GitHub\Projet_CapChat\ScriptBaseIni"
IMAGE_DIR="C:\Users\Hugo\Documents\GitHub\Projet_CapChat\server\views\image"

# Supprimer tout le contenu du répertoire "image"
rm -rf "${IMAGE_DIR}"/*

# Copier les répertoires "neutres" et "singuliers" et le fichier "Indices_singuliers" du répertoire "ScriptBaseIni" vers "image"
cp -r "${SCRIPT_BASE_DIR}/neutres" "${IMAGE_DIR}/"
cp -r "${SCRIPT_BASE_DIR}/singuliers" "${IMAGE_DIR}/"
cp "${SCRIPT_BASE_DIR}/Indices_singuliers.txt" "${IMAGE_DIR}/"

node 1-Script-Base.js
node 2-ScriptAjouteImageNeutre.js
node 3-ScriptAjouteImageSingulier.js
