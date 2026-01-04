# 🔄 Rétrospective Sprint

Application web collaborative pour rétrospectives agiles en temps réel, hébergée gratuitement sur GitHub Pages avec Firebase.

## ✨ Fonctionnalités

- 📝 **Trois colonnes** : Points positifs, Points à améliorer, Actions
- 👥 **Collaboration temps réel** : Plusieurs utilisateurs simultanés
- 👑 **Système de rôles** : Organisateur (OP) avec droits étendus
- 🔐 **Protection anti-usurpation** : Noms d'utilisateur uniques par session
- 👤 **Liste des participants** : Voir qui est présent en temps réel
- 👍 **Système de votes** : Priorisez les sujets importants (sauf actions)
- ⏱️ **Minuteur synchronisé** : Timer temps réel visible par tous, contrôlable par l'OP
- 📥 **Export JSON** : Sauvegardez vos rétrospectives (OP uniquement)
- 🔗 **Partage facile** : Un seul lien pour toute l'équipe
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
        "users": {
          "$userId": {
            ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 30"
          }
        },
        "positive": {
          "$cardId": {
            ".validate": "newData.hasChildren(['id', 'content', 'author', 'votes', 'timestamp']) && newData.child('content').val().length <= 200 && newData.child('author').val().length <= 30"
          }
        },
        "negative": {
          "$cardId": {
            ".validate": "newData.hasChildren(['id', 'content', 'author', 'votes', 'timestamp']) && newData.child('content').val().length <= 200 && newData.child('author').val().length <= 30"
          }
        },
        "action": {
          "$cardId": {
            ".validate": "newData.hasChildren(['id', 'content', 'author', 'votes', 'timestamp']) && newData.child('content').val().length <= 200 && newData.child('author').val().length <= 30"
          }
        }
      }
    }
  }
}
```

## 📖 Utilisation

### 👑 Rôles et Permissions

**Organisateur (OP)** - Celui qui crée la session :
- ✅ Toutes les actions des participants
- ✅ Ajouter/supprimer des **actions**
- ✅ Supprimer **toutes les cartes** (y compris celles des autres)
- ✅ Contrôler le **minuteur** (démarrer/arrêter)
- ✅ **Effacer** toutes les données
- ✅ **Exporter** la rétrospective

**Participants** - Ceux qui rejoignent la session :
- ✅ Ajouter des points positifs et négatifs
- ✅ Supprimer **uniquement leurs propres cartes**
- ✅ Voter sur les points positifs et négatifs (**3 votes max**)
- ✅ Voir les actions et le minuteur
- ❌ Pas d'accès aux actions, minuteur, export ou suppression générale

### Créer une session (Organisateur)

1. **Entrez votre nom** (obligatoire)
2. Cliquez sur "**Nouvelle session**"
3. Vous devenez automatiquement l'**organisateur** (OP)
4. **Votre nom est verrouillé** - impossible de le modifier pour éviter l'usurpation d'identité
5. Partagez l'ID de session avec votre équipe
6. Vous verrez la liste des participants rejoindre en temps réel

### Rejoindre une session (Participant)

1. **Entrez votre nom** (obligatoire)
2. Saisissez l'ID de session partagé
3. Cliquez sur "**Rejoindre**"
4. ⚠️ **Si le nom est déjà pris** par un autre participant, vous devrez en choisir un autre
5. **Votre nom est verrouillé** après jonction pour éviter l'usurpation d'identité
6. Vous rejoignez en tant que **participant**
7. La section de session se masque automatiquement
8. L'ID de session et la liste des participants s'affichent dans le bandeau supérieur

### 🔐 Sécurité des identités

- **Nom obligatoire** : Impossible de créer ou rejoindre une session sans nom d'utilisateur
- **Noms uniques** : Deux participants ne peuvent pas avoir le même nom dans une session
- **Verrouillage** : Une fois connecté, votre nom ne peut plus être modifié
- **Changement d'appareil** : Si vous changez d'appareil avec le même navigateur/profil, vous pouvez rejoindre avec le même nom
- **Liste visible** : Tous les participants voient qui est présent, permettant de repérer toute anomalie

### Ajouter des cartes

**Points positifs et négatifs** (tous) :
1. Tapez votre commentaire (max 200 caractères)
2. Appuyez sur Entrée ou cliquez sur "+"
3. Vos coéquipiers verront la carte en temps réel

**Actions** (OP uniquement) :
1. L'input est **désactivé** pour les participants
2. Seul l'organisateur peut ajouter des actions
3. Les actions définissent les prochaines étapes

### Voter

- Cliquez sur ⬆️ pour voter sur les **points positifs et négatifs**
- Chaque utilisateur dispose de **3 votes maximum**
- Le compteur de votes restants s'affiche dans le bandeau supérieur
- Les cartes sont triées par nombre de votes
- ⚠️ Les **actions ne peuvent pas être votées**

### Supprimer des cartes

- **Participants** : Peuvent supprimer uniquement leurs propres cartes (points positifs/négatifs)
- **Organisateur (OP)** : Peut supprimer toutes les cartes de tous les utilisateurs
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

## 💡 Idées futures

- [ ] Mode sombre
- [ ] Templates de rétrospectives (Start/Stop/Continue, etc.)
- [ ] Authentification utilisateur
- [ ] Historique des sessions
- [ ] Notifications temps réel
- [ ] PWA (Progressive Web App)
- [ ] Export PDF
- [ ] Réactions emoji sur les cartes

---

Fait avec ❤️ pour les équipes agiles
