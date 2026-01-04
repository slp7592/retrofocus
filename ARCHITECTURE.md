# Architecture de l'application Rétrospective

## Structure du projet

```
retrofocus/
├── index.html              # Page HTML principale (185 lignes)
├── css/
│   └── styles.css         # Tous les styles CSS
├── js/
│   ├── app.js             # Point d'entrée et orchestration
│   ├── config.js          # Gestion de la configuration Firebase
│   ├── session.js         # Gestion des sessions collaboratives
│   ├── cards.js           # Gestion des cartes (CRUD)
│   ├── timer.js           # Minuteur de rétrospective
│   └── ui.js              # Utilitaires UI et helpers
└── ARCHITECTURE.md         # Cette documentation
```

## Description des modules

### 📄 index.html
- Page HTML simplifiée contenant uniquement le markup
- Charge les styles CSS et le script principal
- Pas de logique JavaScript inline

### 🎨 css/styles.css
- Tous les styles de l'application
- Design responsive
- Thème moderne avec animations

### 📦 js/config.js
**Responsabilités :**
- Initialisation de Firebase
- Stockage/récupération de la configuration dans localStorage
- **Partage de configuration via URL** (nouvelle fonctionnalité)
- Encodage/décodage de la config en base64
- Validation de la configuration
- Génération de liens de partage

**API principale :**
```javascript
getConfig()                    // Récupère config (URL > localStorage)
saveConfig(config)             // Sauvegarde dans localStorage
initializeFirebase(config)     // Initialise Firebase
generateShareLink(config)      // Génère un lien de partage
validateConfig(config)         // Valide la configuration
```

### 🔗 js/session.js
**Responsabilités :**
- Création de nouvelles sessions
- Jonction à des sessions existantes
- Gestion des listeners temps réel
- Suppression de données
- Export de session

**API principale :**
```javascript
initialize(database)           // Initialise avec la DB Firebase
createNewSession()             // Crée une nouvelle session
joinSession(sessionId)         // Rejoint une session
getCurrentSessionId()          // Récupère l'ID de session actuel
setupRealtimeListener(type, callback)  // Configure listener temps réel
clearSession()                 // Efface les données
exportSession(callback)        // Exporte en JSON
```

### 🗂️ js/cards.js
**Responsabilités :**
- Ajout de cartes (positive/negative/action)
- Suppression de cartes
- Vote sur les cartes
- Synchronisation temps réel des cartes

**API principale :**
```javascript
initialize(database)           // Initialise avec la DB Firebase
addCard(type, content)         // Ajoute une carte
deleteCard(type, key)          // Supprime une carte
voteCard(type, key, votes)     // Vote pour une carte
watchCards(type, callback)     // Observe les changements temps réel
```

### ⏱️ js/timer.js
**Responsabilités :**
- Gestion du minuteur
- Démarrage/pause/arrêt
- Mise à jour de l'affichage

**API principale :**
```javascript
initialize(element)            // Initialise avec l'élément d'affichage
start(minutes)                 // Démarre le timer
pause()                        // Met en pause
stop()                         // Arrête et réinitialise
getTimeRemaining()             // Temps restant en secondes
isRunning()                    // Vérifie si actif
```

### 🎨 js/ui.js
**Responsabilités :**
- Utilitaires d'interface utilisateur
- Gestion du DOM
- Affichage des messages
- Copie dans le presse-papier
- Rendu des cartes
- Téléchargement de fichiers

**API principale :**
```javascript
escapeHtml(text)               // Échappe HTML (sécurité XSS)
copyToClipboard(text)          // Copie dans le presse-papier
showError(message)             // Affiche une erreur
showSuccess(message)           // Affiche un succès
renderCards(container, cards, type, handlers)  // Rend les cartes
downloadJSON(data, filename)   // Télécharge JSON
getInputValue(id)              // Récupère valeur d'input
setInputValue(id, value)       // Définit valeur d'input
```

### 🚀 js/app.js
**Responsabilités :**
- Point d'entrée principal
- Orchestration des modules
- Gestion de l'état global
- Configuration des événements
- Liaison entre UI et logique métier

**Fonctions principales :**
```javascript
initializeApp()                // Initialise l'application au chargement
window.initializeFirebase()    // Configure Firebase depuis le formulaire
window.createNewSession()      // Crée une session
window.joinSession()           // Rejoint une session
window.addCard(type)           // Ajoute une carte
window.voteCard(type, key, votes)  // Vote
window.deleteCard(type, key)   // Supprime
window.clearAll()              // Efface tout
window.exportData()            // Export JSON
window.startTimer(minutes)     // Démarre timer
```

## 🆕 Nouvelle fonctionnalité : Partage de configuration

### Comment ça fonctionne

1. **Configuration initiale** : L'utilisateur configure Firebase une première fois
2. **Génération du lien** : Après configuration, un lien de partage est généré automatiquement
3. **Partage** : L'utilisateur copie ce lien et le partage avec son équipe
4. **Utilisation** : Les membres de l'équipe cliquent sur le lien et la configuration est automatiquement appliquée

### Exemple de lien
```
https://votre-domaine.github.io/retrofocus/?config=eyJhcGlLZXkiOiJBSXphU3kuLi4ifQ==
```

### Sécurité
- La configuration est encodée en base64 (pas de chiffrement)
- Les clés Firebase sont publiques côté client de toute façon
- L'URL est nettoyée après récupération de la config
- La config est sauvegardée dans localStorage pour les prochaines visites

## Flux de données

```
1. Chargement de la page
   └─> app.js:initializeApp()
       ├─> config.js:getConfig()
       │   ├─> Vérifie URL (?config=...)
       │   └─> Sinon, vérifie localStorage
       ├─> config.js:initializeFirebase()
       └─> Initialise tous les modules

2. Création de session
   └─> app.js:createNewSession()
       └─> session.js:createNewSession()
           └─> Firebase Database

3. Ajout de carte
   └─> app.js:addCard()
       └─> cards.js:addCard()
           └─> Firebase Database
               └─> Listener temps réel
                   └─> cards.js:watchCards()
                       └─> ui.js:renderCards()
```

## Avantages de cette architecture

### ✅ Maintenabilité
- Code séparé par responsabilité
- Modules indépendants et réutilisables
- Facile à tester individuellement

### ✅ Lisibilité
- Chaque fichier a une fonction claire
- Code organisé et documenté
- Nommage explicite

### ✅ Extensibilité
- Facile d'ajouter de nouvelles fonctionnalités
- Modules découplés
- APIs bien définies

### ✅ Testabilité
- Modules isolés
- Fonctions pures quand possible
- Dépendances injectées

## Bonnes pratiques

### Import/Export
- Utilisation d'ES6 modules (`import`/`export`)
- Imports explicites et nommés
- Pas de variables globales (sauf APIs publiques via `window`)

### Gestion d'erreur
- Try/catch dans les fonctions async
- Messages d'erreur clairs
- Validation des données

### Performance
- Listeners temps réel optimisés
- Pas de re-render inutiles
- Nettoyage des listeners

### Sécurité
- Échappement HTML contre XSS
- Validation des entrées utilisateur
- CSP (Content Security Policy) configuré
