# Projet CapChat

Une plateforme innovante de CAPTCHA visuel basée sur la reconnaissance d'images singulières parmi un ensemble d'images neutres.

## Description

CapChat est une solution de vérification humaine (CAPTCHA) qui utilise des images artistiques plutôt que du texte déformé. L'utilisateur doit identifier une image "singulière" parmi un ensemble d'images "neutres" en se basant sur un indice textuel. Ce projet comprend à la fois une API backend complète et une interface utilisateur intuitive pour les artistes et administrateurs.

## Fonctionnalités clés

### Pour les utilisateurs finaux
- Interface CAPTCHA visuelle et intuitive
- Thermomètre de temps dynamique (30 secondes par défaut)
- Réduction du temps disponible en cas d'échec (5 secondes par échec)

### Pour les artistes
- Inscription et connexion sécurisée
- Création et gestion de CapChats personnalisés
- Upload d'images via archives ZIP
- Association d'indices/questions aux images singulières
- Visualisation statistique de l'utilisation des CapChats

### Pour les administrateurs
- Gestion des utilisateurs
- Modération des CapChats
- Supervision globale de la plateforme

## Technologies utilisées

### Backend
- Node.js
- Express.js
- MySQL pour le stockage des données relationnelles
- JWT pour l'authentification
- Multer pour la gestion des fichiers uploadés
- Sharp pour le traitement des images
- JSZip pour la gestion des archives

### Frontend
- HTML5/CSS3/JavaScript
- Bootstrap pour l'interface responsive
- EJS comme moteur de template

## Architecture du projet

### Structure des dossiers
```
projet_capchat/
├── server/             # Code serveur Node.js
│   ├── app.js          # Point d'entrée de l'application
│   ├── routes/         # Routes de l'API
│   │   └── userRoutes.js
│   ├── views/          # Templates EJS et ressources frontend
│   │   ├── css/        # Feuilles de style
│   │   ├── js/         # Scripts JavaScript client
│   │   └── image/      # Images statiques (logo, etc.)
├── scriptBaseInit/     # Scripts d'initialisation
├── CapChat/            # Ressources CapChat
│   ├── neutres/        # Images neutres
│   └── singuliers/     # Images singulières
```

### Base de données
Le système utilise une base de données MySQL nommée "CapChat" avec les tables suivantes :
- Users (utilisateurs/artistes)
- Themes (thématiques des CapChats)
- CapChat (collections d'images)
- Images (stockage des métadonnées des images)
- Tokens (jetons d'authentification)

## Installation

### Prérequis
- Node.js (v14 ou supérieur)
- MySQL Server
- npm ou yarn

### Étapes d'installation

1. Cloner le dépôt
```bash
git clone https://github.com/votre-username/projet_capchat.git
cd projet_capchat
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer la base de données
```bash
# Créer la base de données MySQL
mysql -u root -p
CREATE DATABASE CapChat;
```

4. Configurer les variables d'environnement
```bash
# Créer un fichier .env avec les informations suivantes
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=CapChat
JWT_SECRET=votre_secret_jwt
```

5. Démarrer le serveur
```bash
npm start
```

Le serveur sera accessible à l'adresse http://localhost:3000

## Utilisation

### Intégration du CapChat dans un site tiers

Pour intégrer un CapChat dans votre site web, utilisez le code suivant :

```html
<!-- Ajouter le CapChat à votre formulaire -->
<form action="/votre-action" method="post">
    <!-- Vos champs de formulaire habituels -->
    <input type="text" name="nom" required>
    
    <!-- Zone où le CapChat sera injecté -->
    <div id="capchat-container"></div>
    
    <!-- Bouton de soumission qui sera activé après validation du CapChat -->
    <button type="submit" id="submit-btn" disabled>Envoyer</button>
</form>

<!-- Script d'intégration CapChat -->
<script src="https://votre-serveur.com/api/capchat/IDENTIFIANT_CAPCHAT"></script>
<script>
    document.addEventListener('DOMContentLoaded', function() {
        initCapChat('capchat-container', function(success) {
            if (success) {
                document.getElementById('submit-btn').disabled = false;
            }
        });
    });
</script>
```

### Interface administrateur

1. Accédez à `/connexion` pour vous connecter
2. Utilisez les identifiants administrateur fournis (admin/admin par défaut)
3. Gérez les utilisateurs depuis le tableau de bord administrateur

### Interface artiste

1. Inscrivez-vous ou connectez-vous à `/connexion`
2. Accédez à l'interface de création via "Créer CapChat"
3. Téléchargez vos archives ZIP d'images et configurez votre CapChat
4. Assignez des questions/indices à chaque image singulière
5. Publiez votre CapChat pour qu'il soit disponible

## API REST

L'API REST expose les endpoints suivants :

### Authentification
- `POST /api/register` : Inscription d'un nouvel utilisateur
- `POST /api/login` : Connexion avec génération de token JWT
- `GET /api/logout` : Déconnexion

### Gestion des CapChats
- `POST /api/capchat` : Création d'un nouveau CapChat
- `GET /api/capchat/:id` : Récupération des détails d'un CapChat
- `PUT /api/capchat/:id` : Mise à jour d'un CapChat existant
- `DELETE /api/capchat/:id` : Suppression d'un CapChat

### Gestion des thèmes
- `GET /api/themes` : Liste de tous les thèmes disponibles
- `POST /api/themes` : Création d'un nouveau thème (admin)

### Utilisateurs
- `GET /api/user/:id` : Informations sur un utilisateur
- `PUT /api/user/:id` : Mise à jour du profil utilisateur
- `GET /api/user/:id/capchats` : Liste des CapChats créés par un utilisateur

## Considérations de sécurité

- Les mots de passe sont hashés avec bcrypt
- L'authentification utilise des tokens JWT stockés dans des cookies
- Protection CSRF sur les formulaires
- Vérification des types de fichiers lors des uploads
- Nettoyage des données avant insertion en base de données
