# Changelog

## Version 3.2.0 - 2026-01-04

### 🔐 Sécurité anti-usurpation et popups modernes

#### ✨ Nouvelles fonctionnalités

- **Protection anti-usurpation d'identité**
  - Nom d'utilisateur obligatoire pour créer ou rejoindre une session
  - Validation d'unicité : un nom ne peut être utilisé que par un seul participant par session
  - Verrouillage du nom après jonction (impossible de le modifier)
  - Permet à un même utilisateur de rejoindre depuis plusieurs appareils
  - Message d'erreur clair si le nom est déjà pris : "Le nom X est déjà utilisé par un autre participant"

- **Liste des participants en temps réel**
  - Affichage de tous les participants actifs dans la session
  - Badge coloré pour l'utilisateur actuel (vert)
  - Badge coloré pour l'organisateur (violet)
  - Compteur de participants
  - Permet à l'équipe de repérer toute usurpation d'identité

- **Système de popups personnalisées**
  - Remplacement de tous les `alert()` natifs par des popups élégantes
  - Remplacement de tous les `confirm()` natifs par des popups de confirmation
  - Design moderne avec animations (fadeIn, slideIn)
  - Impossible à bloquer par les préférences du navigateur
  - Cohérence visuelle avec le reste de l'application
  - Notification de fin de timer modernisée

#### 🗄️ Structure Firebase

- **Nouvelle structure `users`** dans les sessions
  - Stocke `{ userId: userName }` pour chaque participant
  - Permet la validation d'unicité des noms
  - Règles de validation Firebase ajoutées

#### 🔧 Améliorations techniques

- `session.js` :
  - `createNewSession(userName)` valide le nom obligatoire
  - `joinSession(sessionId, userName)` vérifie l'unicité du nom
  - `getCurrentUserName()` récupère le nom verrouillé
  - `watchParticipants(callback)` observe les participants en temps réel
- `cards.js` :
  - Utilise le nom d'utilisateur verrouillé de la session
  - `deleteCard()` prend un callback pour confirmation personnalisée
- `ui.js` :
  - `showError(message)` retourne une Promise avec popup personnalisée
  - `showSuccess(message)` retourne une Promise avec popup personnalisée
  - `showConfirm(message)` retourne une Promise avec popup de confirmation
- `app.js` :
  - `lockUserNameInput()` désactive et grise l'input après jonction
  - `setupParticipantsListener()` configure l'affichage des participants
  - `updateParticipantsList(users)` met à jour l'UI avec badges
  - `handleTimerEnd()` utilise la popup personnalisée
- `timer.js` :
  - Callback `onTimerEnd` pour notification personnalisée de fin

#### 📚 Documentation

- Mise à jour de **README.md** avec section "Sécurité des identités"
- Mise à jour de **ARCHITECTURE.md** avec nouvelles APIs
- Mise à jour de **FIREBASE_RULES.md** avec structure `users`
- Ajout de cette entrée dans **CHANGELOG.md**

#### 🔒 Sécurité

- Validation côté client (JavaScript) ET côté serveur (règles Firebase)
- Protection contre l'usurpation d'identité sans nécessiter de mots de passe
- Liste des participants visible pour transparence
- Popups personnalisées impossible à bloquer

## Version 3.1.0 - 2026-01-04

### 🎉 Améliorations UX et quota de votes

#### ✨ Nouvelles fonctionnalités

- **Limitation des votes à 3 par utilisateur**
  - Chaque participant dispose de 3 votes maximum
  - Compteur de votes restants affiché dans le bandeau supérieur
  - Message d'erreur si quota atteint
  - Compteur mis à jour en temps réel après chaque vote

- **Suppression basée sur l'auteur**
  - Les participants ne peuvent supprimer que leurs propres cartes
  - L'OP peut supprimer toutes les cartes de tous les utilisateurs
  - Validation côté client avec messages d'erreur explicites
  - Amélioration de la sécurité et de la collaboration

- **Interface utilisateur améliorée**
  - Section de session masquée automatiquement après avoir créé/rejoint
  - ID de session affiché dans le bandeau supérieur (entre titre et nom d'utilisateur)
  - Meilleure visibilité de l'ID de session actif
  - Interface plus épurée pendant l'utilisation

- **Minuteur simplifié**
  - Bouton "Pause" supprimé (uniquement Démarrer/Stop)
  - Interface plus simple et intuitive
  - Trois presets : 5, 7 et 10 minutes

#### 🔧 Améliorations techniques

- Fonction `updateVoteDisplay()` pour mise à jour du compteur
- Fonction `updateSessionUI()` pour gérer l'affichage après connexion
- Passage de l'auteur de carte dans les gestionnaires d'événements
- Validation des permissions de suppression côté client
- Meilleure séparation des préoccupations dans le code

## Version 3.0.0 - 2026-01-04

### 🎉 Système de permissions et timer synchronisé

#### ✨ Nouvelles fonctionnalités majeures

- **Système de rôles Organisateur/Participant**
  - L'utilisateur qui crée la session devient l'Organisateur (OP)
  - ID utilisateur unique stocké dans localStorage
  - Permissions différenciées selon le rôle

- **Permissions de l'Organisateur (OP)** :
  - Seul l'OP peut ajouter/supprimer des actions
  - Seul l'OP peut contrôler le minuteur
  - Seul l'OP peut effacer toutes les données
  - Seul l'OP peut exporter la rétrospective

- **Actions sans votes**
  - Les cartes d'actions n'ont plus de système de vote
  - Interface simplifiée pour les actions
  - Réservées à l'organisateur uniquement

- **Minuteur synchronisé en temps réel**
  - Le timer est stocké dans Firebase
  - Tous les participants voient le même décompte
  - Seul l'OP peut le contrôler
  - Synchronisation automatique même en cas de latence réseau

- **UI adaptative selon les permissions**
  - Boutons et contrôles cachés pour les participants
  - Input des actions désactivé pour les non-OP
  - Messages d'erreur explicites si tentative d'action non autorisée

## Version 2.0.0 - 2026-01-04

### 🎉 Refactoring majeur et nouvelles fonctionnalités

#### ✨ Nouvelles fonctionnalités

- **Partage de configuration via URL** : Plus besoin de reconfigurer Firebase sur chaque machine
  - Généré automatiquement après l'initialisation
  - Lien copiable en un clic
  - Configuration encodée en base64 dans l'URL
  - Nettoyage automatique de l'URL après récupération

#### 🏗️ Architecture

- **Architecture modulaire** : Code réorganisé en 6 modules JavaScript distincts
  - `config.js` : Gestion de la configuration Firebase + partage URL
  - `session.js` : Gestion des sessions collaboratives
  - `cards.js` : CRUD des cartes + votes
  - `timer.js` : Minuteur de rétrospective
  - `ui.js` : Utilitaires UI et helpers
  - `app.js` : Orchestration et point d'entrée

- **Séparation des préoccupations** : HTML, CSS et JS dans des fichiers séparés
  - Réduction de 900 lignes à 185 lignes dans index.html (78% de réduction)
  - Meilleure maintenabilité et testabilité

#### 🐛 Corrections de bugs

- ✅ Modal de configuration ne s'affiche plus au démarrage si déjà configuré
- ✅ Toutes les erreurs CSP (Content Security Policy) corrigées
  - Ajout de `https://*.firebasedatabase.app` pour scripts et frames
  - Ajout de `wss://*.firebasedatabase.app` pour WebSocket
  - Support des source maps Firebase
- ✅ Suppression de `document.execCommand('copy')` obsolète
- ✅ Correction de l'erreur "Aucune session active" au démarrage

#### 📚 Documentation

- **README.md** : Guide utilisateur complet
- **ARCHITECTURE.md** : Documentation technique détaillée
- **CHANGELOG.md** : Ce fichier
- **.gitignore** : Configuration Git

#### 🔄 Changements de comportement

**Flux d'initialisation Firebase :**
1. Utilisateur remplit le formulaire de configuration
2. Clic sur "Initialiser Firebase"
3. **NOUVEAU** : Affichage du lien de partage avec bouton pour copier
4. **NOUVEAU** : Bouton "Continuer vers l'application →" pour démarrer
5. Application principale s'affiche

**Flux avec lien de partage (nouveau) :**
1. Utilisateur clique sur le lien partagé (contient `?config=...`)
2. Configuration appliquée automatiquement
3. Redirection vers l'application principale
4. Prêt à créer/rejoindre une session

#### 🔒 Sécurité

- API Clipboard moderne (pas de méthode dépréciée)
- Validation des configurations
- Échappement HTML contre XSS
- CSP renforcé

#### 📊 Métriques

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| Fichiers HTML | 900 lignes | 185 lignes | -78% |
| Maintenabilité | Difficile | Excellente | N/A |
| Testabilité | Impossible | Facile | N/A |
| Modules | 1 monolithe | 6 modules | +600% |

---

## Version 1.0.0 - 2026-01-03

### Première version

- Rétrospectives collaboratives temps réel
- Trois colonnes (positif, négatif, actions)
- Système de votes
- Minuteur intégré
- Export JSON
- Synchronisation Firebase
