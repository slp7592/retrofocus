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
- Création de nouvelles sessions avec phase initiale 'reflexion'
- Jonction à des sessions existantes avec validation du nom unique
- **Gestion du workflow en 3 phases** (reflexion, vote, action)
- Gestion de la liste des participants en temps réel
- Verrouillage du nom d'utilisateur après jonction
- Gestion des listeners temps réel
- Suppression de données avec confirmation personnalisée
- Export de session

**API principale :**
```javascript
initialize(database)           // Initialise avec la DB Firebase
createNewSession(userName)     // Crée une nouvelle session (nom obligatoire, phase: reflexion)
joinSession(sessionId, userName)  // Rejoint une session (validation unicité)
getCurrentSessionId()          // Récupère l'ID de session actuel
getCurrentUserName()           // Récupère le nom d'utilisateur verrouillé
getCurrentPhase()              // Récupère la phase actuelle (reflexion/vote/action)
setPhase(newPhase)             // Change la phase (OP uniquement)
watchPhase(callback)           // Observe les changements de phase
setupRealtimeListener(type, callback)  // Configure listener temps réel
watchParticipants(callback)    // Observe les participants en temps réel
clearSession(confirmCallback)  // Efface les données avec confirmation
exportSession(callback)        // Exporte en JSON
```

### 🗂️ js/cards.js
**Responsabilités :**
- Ajout de cartes (positive/negative/action) **avec validation selon la phase**
- Suppression de cartes avec confirmation personnalisée **selon la phase**
- Vote sur les cartes **uniquement en phase Vote**
- **Filtrage des cartes selon la phase** (privé en Réflexion, public après)
- Synchronisation temps réel des cartes
- Utilisation du nom d'utilisateur verrouillé de la session

**Règles par phase :**
- **Réflexion** : Ajout pos/neg autorisé, votes bloqués, actions bloquées
- **Vote** : Ajout bloqué, votes autorisés, suppression pos/neg autorisée, actions bloquées
- **Actions** : Ajout bloqué sauf actions (OP), votes bloqués, suppression pos/neg bloquée

**API principale :**
```javascript
initialize(database)           // Initialise avec la DB Firebase
addCard(type, content)         // Ajoute une carte (validation phase)
deleteCard(type, key, author, confirmCallback)  // Supprime une carte (validation phase)
voteCard(type, key, votes)     // Vote pour une carte (phase Vote uniquement)
watchCards(type, callbackFiltered, callbackRaw)  // Observe avec filtrage par phase
filterCardsByPhase(cards, type)  // Filtre les cartes selon la phase actuelle
```

### ⏱️ js/timer.js
**Responsabilités :**
- Gestion du minuteur
- Démarrage/pause/arrêt
- Mise à jour de l'affichage
- Notification personnalisée de fin de timer

**API principale :**
```javascript
initialize(element, onUpdate, onTimerEnd)  // Initialise avec l'élément et callbacks
start(minutes)                 // Démarre le timer
pause()                        // Met en pause
stop()                         // Arrête et réinitialise
getTimeRemaining()             // Temps restant en secondes
isRunning()                    // Vérifie si actif
syncFromFirebase(timerData)    // Synchronise avec Firebase (participants)
```

### 🎨 js/ui.js
**Responsabilités :**
- Utilitaires d'interface utilisateur
- Gestion du DOM
- **Système de popups personnalisées** (remplace alert/confirm natifs)
- **Rendu des cartes avec animations** de mouvement lors du tri
- **Gestion des permissions d'affichage** (boutons vote/suppression selon phase)
- Copie dans le presse-papier
- Téléchargement de fichiers

**API principale :**
```javascript
escapeHtml(text)               // Échappe HTML (sécurité XSS)
copyToClipboard(text)          // Copie dans le presse-papier
showError(message)             // Affiche une popup d'erreur personnalisée
showSuccess(message)           // Affiche une popup de succès personnalisée
showConfirm(message)           // Affiche une popup de confirmation personnalisée
renderCards(container, cards, type, handlers)  // Rend les cartes avec animations
downloadJSON(data, filename)   // Télécharge JSON
getInputValue(id)              // Récupère valeur d'input
setInputValue(id, value)       // Définit valeur d'input
capitalize(str)                // Capitalise la première lettre
```

**Animations :**
- Détection automatique des cartes qui changent de position
- Animation visuelle dorée quand une carte monte/descend après un vote
- Stockage de l'ordre précédent pour comparaison

### 🚀 js/app.js
**Responsabilités :**
- Point d'entrée principal
- Orchestration des modules
- **Gestion du workflow et des phases**
- **Mise à jour de l'UI selon la phase** (stepper, permissions, filtrage)
- Gestion de l'état global
- Configuration des événements
- Liaison entre UI et logique métier

**Fonctions principales :**
```javascript
initializeApp()                // Initialise l'application au chargement
window.initializeFirebase()    // Configure Firebase depuis le formulaire
window.createNewSession()      // Crée une session (phase: reflexion)
window.joinSession()           // Rejoint une session
window.nextPhase()             // Passe à la phase suivante (OP uniquement)
window.addCard(type)           // Ajoute une carte (validation phase)
window.voteCard(type, key, votes)  // Vote (phase Vote uniquement)
window.deleteCard(type, key)   // Supprime (selon phase)
window.copySessionIdToClipboard()  // Copie l'ID de session
window.clearAll()              // Efface tout
window.exportData()            // Export JSON
window.startTimer(minutes)     // Démarre timer
```

**Gestion du workflow :**
- `setupPhaseListener()` : Écoute les changements de phase
- `updatePhaseUI(phase)` : Met à jour le stepper et les permissions
- `refreshAllCards()` : Force le re-rendu des cartes selon la nouvelle phase
- `canDeleteCard(card, type)` : Détermine les droits de suppression selon phase
- `canVoteOnCards()` : Détermine si les votes sont possibles

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

## 🔄 Workflow en 3 phases

### Vue d'ensemble

L'application guide l'équipe à travers un workflow structuré en 3 phases, géré par l'organisateur (OP).

```
Phase 1: Réflexion (💭)
└─> Cartes privées, pas de votes
    └─> [Bouton OP] "Révéler les cartes et passer au vote"
        └─> Phase 2: Vote (👍)
            └─> Toutes cartes révélées, votes actifs
                └─> [Bouton OP] "Terminer les votes et passer aux actions"
                    └─> Phase 3: Actions (🎯)
                        └─> Lecture seule, création d'actions (OP)
```

### Mécanismes techniques

**1. Stockage de la phase**
- Champ `phase` dans Firebase : `'reflexion' | 'vote' | 'action'`
- Variable locale `currentPhase` dans session.js
- Synchronisation temps réel via `watchPhase()`

**2. Filtrage des cartes**
- `watchCards()` retourne 2 callbacks : cartes brutes + cartes filtrées
- En phase Réflexion : `filterCardsByPhase()` ne garde que les cartes de l'utilisateur
- En phases Vote/Actions : toutes les cartes sont visibles

**3. Validation des actions**
- `addCard()` vérifie la phase avant d'autoriser l'ajout
- `voteCard()` bloque si `currentPhase !== 'vote'`
- `deleteCard()` bloque la suppression pos/neg en phase Actions

**4. Interface utilisateur**
- Stepper visuel avec 3 étapes (💭→👍→🎯)
- Boutons OP pour changer de phase (visibles OP uniquement)
- Désactivation conditionnelle des inputs et boutons
- Masquage des boutons de vote/suppression selon permissions

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
           ├─> Crée session avec phase: 'reflexion'
           └─> Firebase Database
               └─> Listener phase
                   └─> app.js:updatePhaseUI()

3. Changement de phase (OP)
   └─> app.js:nextPhase()
       └─> session.js:setPhase('vote')
           └─> Firebase Database
               └─> Listener phase (tous)
                   └─> app.js:updatePhaseUI()
                       └─> app.js:refreshAllCards()
                           └─> cards.js:filterCardsByPhase()
                               └─> ui.js:renderCards()

4. Ajout de carte
   └─> app.js:addCard()
       └─> cards.js:addCard()
           ├─> Validation phase
           └─> Firebase Database
               └─> Listener temps réel
                   └─> cards.js:watchCards()
                       ├─> Filtre selon phase
                       └─> ui.js:renderCards()
                           └─> Animation si position change
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
- **Protection anti-usurpation d'identité** :
  - Noms d'utilisateur uniques par session
  - Verrouillage du nom après jonction
  - Validation côté client et serveur (Firebase)
  - Liste des participants visible en temps réel
- **Popups sécurisées** :
  - Système de notification personnalisé
  - Impossible à bloquer par les préférences navigateur
  - Animations élégantes et cohérentes
