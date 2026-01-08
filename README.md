# 🔄 Retro Focus

Application web collaborative pour rétrospectives agiles en temps réel, hébergée gratuitement sur GitHub Pages avec Firebase.

## ✨ Fonctionnalités

### Workflow en 4 phases
- 💭 **Phase Réflexion** : Chacun crée ses cartes de façon privée
- 📦 **Phase Regroupement** : L'OP regroupe les cartes similaires par drag & drop
- 👍 **Phase Vote** : L'équipe vote pour prioriser les cartes et groupes
- 🎯 **Phase Actions** : L'OP définit les actions à entreprendre

### Collaboration temps réel
- 📝 **Trois colonnes** : Points positifs, Points à améliorer, Actions
- 👥 **Multi-utilisateurs** : Plusieurs participants simultanés
- 👑 **Système de rôles** : Organisateur (OP) avec droits étendus
- 🔐 **Protection anti-usurpation** : Noms d'utilisateur uniques par session
- 👤 **Liste des participants** : Voir qui est présent en temps réel avec badges

### Système de votes
- 👍 **3 votes par personne** : Priorisez les sujets importants
- 🎨 **Animation visuelle** : Les cartes qui montent dans le classement s'animent
- 📊 **Tri automatique** : Les cartes les plus votées en haut

### Fonctionnalités avancées
- ⏱️ **Minuteur synchronisé** : Timer temps réel visible par tous, contrôlable par l'OP
- 📥 **Export JSON** : Sauvegardez vos rétrospectives (OP uniquement)
- 🔗 **Partage facile** : Copiez l'ID de session en un clic
- 🎨 **Popups modernes** : Notifications élégantes, jamais bloquées par le navigateur
- 🔒 **Sécurisé** : Content Security Policy configuré + permissions
- 💯 **100% Gratuit** : GitHub Pages + Firebase gratuit

## 🚀 Démarrage rapide

### Option 1 : Utiliser un lien de partage

Si quelqu'un de votre équipe a déjà configuré l'application :
1. Cliquez sur le lien de partage qu'on vous a donné
2. La configuration se fait automatiquement
3. Créez ou rejoignez une session

### Option 2 : Configuration initiale

#### 1. Créer un projet Firebase (gratuit)

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Créez un nouveau projet
3. Activez **Realtime Database** en mode test
4. Allez dans Paramètres → Vos applications → Web (icône `</>`)
5. Copiez les valeurs de configuration

#### 2. Configurer l'application

1. Ouvrez l'application
2. Remplissez le formulaire avec vos identifiants Firebase
3. Cliquez sur "Initialiser Firebase"
4. **Copiez le lien de partage** généré pour votre équipe

#### 3. Configurer les règles de sécurité Firebase

Dans Firebase Console → Realtime Database → Règles :

```json
{
  "rules": {
    "sessions": {
      "$sessionId": {
        ".read": true,
        ".write": true,

        "owner": {
          ".validate": "newData.isString() && newData.val().length > 0"
        },

        "phase": {
          ".validate": "newData.isString() && (newData.val() === 'reflexion' || newData.val() === 'regroupement' || newData.val() === 'vote' || newData.val() === 'action')"
        },

        "users": {
          "$userId": {
            ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 30"
          }
        },

        "positive": {
          "$cardId": {
            ".validate": "newData.hasChildren(['id', 'content', 'author', 'votes', 'timestamp']) && newData.child('content').val().length <= 200 && newData.child('author').val().length <= 30 && newData.child('votes').isNumber() && (!newData.child('groupId').exists() || newData.child('groupId').isString())"
          }
        },

        "negative": {
          "$cardId": {
            ".validate": "newData.hasChildren(['id', 'content', 'author', 'votes', 'timestamp']) && newData.child('content').val().length <= 200 && newData.child('author').val().length <= 30 && newData.child('votes').isNumber() && (!newData.child('groupId').exists() || newData.child('groupId').isString())"
          }
        },

        "action": {
          "$cardId": {
            ".validate": "newData.hasChildren(['id', 'content', 'author', 'timestamp']) && newData.child('content').val().length <= 200 && newData.child('author').val().length <= 30"
          }
        },

        "timer": {
          "timeRemaining": {
            ".validate": "newData.isNumber() && newData.val() >= 0"
          },
          "isRunning": {
            ".validate": "newData.isBoolean()"
          },
          "lastUpdate": {
            ".validate": "newData.isNumber()"
          }
        }
      }
    }
  }
}
```

## 📖 Utilisation

### 🔄 Workflow de rétrospective

L'application guide l'équipe à travers 4 phases distinctes :

#### Phase 1️⃣ : Réflexion (💭)
- **Chaque participant crée ses cartes** positives et négatives
- Les cartes sont **privées** : chacun voit uniquement **ses propres cartes**
- Les votes sont **désactivés**
- Les actions ne peuvent pas être créées
- L'OP voit un bouton **"▶️ Révéler les cartes et passer au regroupement"**

#### Phase 2️⃣ : Regroupement (📦)
- **TOUTES les cartes sont révélées** à tous les participants
- Seul l'**OP peut regrouper** les cartes similaires par **drag & drop**
- Les cartes regroupées affichent un **badge 📦** avec le nombre de cartes
- Cliquez sur le badge pour voir le **détail du groupe**
- L'OP peut **dégrouper** (↩️ pour une carte, 📤 pour tout le groupe)
- Les votes et l'ajout de nouvelles cartes sont **bloqués**
- L'OP voit un bouton **"▶️ Verrouiller les groupes et passer au vote"**

#### Phase 3️⃣ : Vote (👍)
- Les **groupes sont verrouillés** (plus de regroupement possible)
- Chaque participant peut **voter** sur les cartes ou groupes (3 votes maximum)
- Un vote sur un groupe compte comme **1 seul vote** sur la première carte
- Les cartes sont **triées par nombre de votes**
- **Animation visuelle** quand une carte change de position
- Seul l'**OP peut supprimer** des cartes
- L'OP voit un bouton **"▶️ Terminer les votes et passer aux actions"**

#### Phase 4️⃣ : Actions (🎯)
- Les cartes et votes restent **visibles en lecture seule**
- Les votes et suppressions de cartes pos/neg sont **bloqués**
- Seul l'**OP peut créer des actions** pour définir les prochaines étapes
- Fin du workflow

### 👑 Rôles et Permissions

**Organisateur (OP)** - Celui qui crée la session :
- ✅ Contrôle le **workflow** (passer d'une phase à l'autre)
- ✅ Toutes les actions des participants
- ✅ **Regrouper/dégrouper** les cartes (phase Regroupement uniquement)
- ✅ Ajouter/supprimer des **actions** (phase Actions uniquement)
- ✅ Supprimer **toutes les cartes** selon la phase
- ✅ Contrôler le **minuteur** (démarrer/arrêter)
- ✅ **Effacer** toutes les données
- ✅ **Exporter** la rétrospective

**Participants** - Ceux qui rejoignent la session :
- ✅ Ajouter des points positifs et négatifs (phase Réflexion uniquement)
- ✅ Supprimer **leurs propres cartes** (phase Réflexion uniquement)
- ✅ Voir les **groupes de cartes** créés par l'OP (phase Regroupement et Vote)
- ✅ Voter sur les points positifs, négatifs et groupes (phase Vote uniquement, **3 votes max**)
- ✅ Voir les actions et le minuteur
- ❌ Pas d'accès au contrôle de phase, regroupement, actions, minuteur, export ou suppression en phase Vote

### Créer une session (Organisateur)

1. **Entrez votre nom** (obligatoire)
2. Cliquez sur "**Nouvelle session**"
3. Vous devenez automatiquement l'**organisateur** (OP)
4. **Votre nom est verrouillé** - impossible de le modifier pour éviter l'usurpation d'identité
5. Partagez l'ID de session avec votre équipe (cliquez sur l'ID dans le bandeau pour le copier 📋)
6. Vous verrez la liste des participants rejoindre en temps réel
7. Le **stepper de phases** s'affiche en haut : 💭 Réflexion → 📦 Regroupement → 👍 Vote → 🎯 Actions

### Rejoindre une session (Participant)

1. **Entrez votre nom** (obligatoire)
2. Saisissez l'ID de session partagé
3. Cliquez sur "**Rejoindre**"
4. ⚠️ **Si le nom est déjà pris** par un autre participant, vous devrez en choisir un autre
5. **Votre nom est verrouillé** après jonction pour éviter l'usurpation d'identité
6. Vous rejoignez en tant que **participant**
7. La section de session se masque automatiquement
8. L'ID de session (cliquable pour copier 📋) et la liste des participants s'affichent dans le bandeau supérieur
9. Le **stepper de phases** indique la phase actuelle de la rétrospective

### 🔐 Sécurité des identités

- **Nom obligatoire** : Impossible de créer ou rejoindre une session sans nom d'utilisateur
- **Noms uniques** : Deux participants ne peuvent pas avoir le même nom dans une session
- **Verrouillage** : Une fois connecté, votre nom ne peut plus être modifié
- **Changement d'appareil** : Si vous changez d'appareil avec le même navigateur/profil, vous pouvez rejoindre avec le même nom
- **Liste visible** : Tous les participants voient qui est présent, permettant de repérer toute anomalie

### Ajouter des cartes

**Points positifs et négatifs** (Phase Réflexion uniquement) :
1. Tapez votre commentaire (max 200 caractères)
2. Appuyez sur Entrée ou cliquez sur "+"
3. En phase Réflexion : **vos cartes restent privées**
4. En phase Regroupement et Vote : toutes les cartes sont révélées
5. ⚠️ Après la phase Réflexion, **impossible d'ajouter de nouvelles cartes**

**Actions** (OP uniquement, Phase Actions) :
1. L'input est **désactivé** jusqu'à la phase Actions
2. En phase Actions, seul l'OP peut ajouter des actions
3. Les actions définissent les prochaines étapes

### Regrouper des cartes (OP uniquement)

**En phase Regroupement :**
- Seul l'**OP peut regrouper** les cartes similaires
- **Glisser-déposer** une carte sur une autre pour créer un groupe
- Les cartes groupées affichent un **badge 📦** avec le nombre de cartes
- **Cliquez sur le badge** pour voir le détail des cartes du groupe
- **Dégrouper** : Bouton ↩️ sur une carte ou 📤 pour tout le groupe
- Les groupes sont **verrouillés** en passant à la phase Vote

**Affichage des groupes :**
- La **première carte** du groupe est visible
- Le **compteur de votes** affiche le total du groupe
- Un vote sur le groupe incrémente uniquement la première carte

### Voter

- **Disponible uniquement en Phase Vote**
- Cliquez sur ⬆️ pour voter sur les **cartes individuelles ou groupes**
- Chaque utilisateur dispose de **3 votes maximum**
- Le compteur de votes restants s'affiche dans le bandeau supérieur
- Les cartes/groupes sont **triées automatiquement** par nombre de votes
- **Animation visuelle dorée** 🌟 quand une carte change de position après un vote
- ⚠️ Les **actions ne peuvent pas être votées**
- ⚠️ En phase Actions, les votes sont **désactivés** (lecture seule)

### Supprimer des cartes

**En phase Réflexion :**
- **Participants** : Peuvent supprimer uniquement leurs propres cartes
- **Organisateur (OP)** : Peut supprimer toutes les cartes

**En phase Regroupement :**
- **Organisateur (OP)** : Peut supprimer toutes les cartes
- **Participants** : Ne peuvent pas supprimer de cartes

**En phase Vote :**
- Seul l'**Organisateur (OP)** peut supprimer des cartes
- Le bouton 🗑️ n'apparaît que pour l'OP

**En phase Actions :**
- Les cartes positives/négatives ne peuvent **plus être supprimées**
- Seul l'OP peut supprimer des actions

### Minuteur synchronisé

- **OP** : Contrôle complet (démarrer/arrêter)
- **Participants** : Voient le timer en temps réel
- Le décompte est synchronisé entre tous les participants
- Boutons du timer masqués pour les participants

### Exporter (OP uniquement)

- Cliquez sur "Télécharger (JSON)"
- Sauvegardez la rétrospective pour vos archives
- ⚠️ Bouton visible uniquement pour l'organisateur

## 🏗️ Architecture

```
retrofocus/
├── index.html              # Page principale
├── css/
│   └── styles.css         # Styles
├── js/
│   ├── app.js             # Point d'entrée
│   ├── config.js          # Configuration Firebase + partage
│   ├── session.js         # Gestion des sessions
│   ├── cards.js           # Gestion des cartes
│   ├── timer.js           # Minuteur
│   └── ui.js              # Utilitaires UI
└── ARCHITECTURE.md         # Documentation technique
```

Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour plus de détails.

## 🔧 Développement

### Prérequis

- Un navigateur moderne (Chrome, Firefox, Edge, Safari)
- Un serveur web local (pour tester localement)

### Lancer localement

```bash
# Option 1 : Python
python -m http.server 8000

# Option 2 : Node.js
npx http-server

# Option 3 : PHP
php -S localhost:8000
```

Puis ouvrez `http://localhost:8000`

### Structure modulaire

L'application utilise des modules ES6 pour une meilleure maintenabilité :
- Séparation des responsabilités
- Code réutilisable
- Facile à tester
- APIs claires entre modules

## 🔒 Sécurité

- **CSP** : Content Security Policy configuré
- **Validation** : Entrées utilisateur validées
- **XSS** : Protection contre les failles XSS
- **Anti-usurpation** : Noms d'utilisateur uniques et verrouillés par session
- **Popups sécurisées** : Notifications personnalisées jamais bloquées
- **Firebase** : Règles de sécurité configurables

## 📝 License

MIT - Utilisez librement pour vos équipes !

## 🤝 Contribution

Les contributions sont bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des fonctionnalités
- Soumettre des pull requests


---

Fait avec ❤️ pour les équipes agiles
