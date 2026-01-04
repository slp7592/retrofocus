# 🔄 Rétrospective Sprint

Application web collaborative pour rétrospectives agiles en temps réel, hébergée gratuitement sur GitHub Pages avec Firebase.

## ✨ Fonctionnalités

- 📝 **Trois colonnes** : Points positifs, Points à améliorer, Actions
- 👥 **Collaboration temps réel** : Plusieurs utilisateurs simultanés
- 👍 **Système de votes** : Priorisez les sujets importants
- ⏱️ **Minuteur intégré** : Timebox vos rétrospectives
- 📥 **Export JSON** : Sauvegardez vos rétrospectives
- 🔗 **Partage facile** : Un seul lien pour toute l'équipe
- 🔒 **Sécurisé** : Content Security Policy configuré
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

### Créer une session

1. Entrez votre nom
2. Cliquez sur "Nouvelle session"
3. Partagez l'ID de session avec votre équipe

### Rejoindre une session

1. Entrez votre nom
2. Saisissez l'ID de session partagé
3. Cliquez sur "Rejoindre"

### Ajouter des cartes

1. Tapez votre commentaire (max 200 caractères)
2. Appuyez sur Entrée ou cliquez sur "+"
3. Vos coéquipiers verront la carte en temps réel

### Voter

- Cliquez sur ⬆️ pour voter
- Les cartes sont triées par nombre de votes

### Exporter

- Cliquez sur "Télécharger (JSON)"
- Sauvegardez la rétrospective pour vos archives

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
