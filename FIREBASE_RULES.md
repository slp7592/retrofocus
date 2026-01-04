# Règles de sécurité Firebase pour Rétrospective

## ⚠️ Important

Après avoir configuré Firebase, vous devez mettre à jour les règles de sécurité dans la console Firebase.

## 📋 Règles de sécurité recommandées

Allez dans **Firebase Console** → **Realtime Database** → **Règles** et collez ce JSON :

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

        "users": {
          "$userId": {
            ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 30"
          }
        },

        "positive": {
          "$cardId": {
            ".validate": "newData.hasChildren(['id', 'content', 'author', 'votes', 'timestamp']) && newData.child('content').val().length <= 200 && newData.child('author').val().length <= 30 && newData.child('votes').isNumber()"
          }
        },

        "negative": {
          "$cardId": {
            ".validate": "newData.hasChildren(['id', 'content', 'author', 'votes', 'timestamp']) && newData.child('content').val().length <= 200 && newData.child('author').val().length <= 30 && newData.child('votes').isNumber()"
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

## 🔐 Explication des règles

### Structure de session

Chaque session contient :
- **owner** : ID de l'organisateur (OP) de la session
- **users** : Liste des participants { userId: userName } pour prévenir l'usurpation d'identité
- **positive** : Cartes des points positifs
- **negative** : Cartes des points à améliorer
- **action** : Cartes d'actions (OP uniquement)
- **timer** : État du minuteur synchronisé

### Validation des participants

**users** :
- Chaque userId est associé à un nom d'utilisateur
- Le nom doit être une chaîne non vide
- Maximum 30 caractères
- Empêche deux participants différents d'avoir le même nom

### Validation des cartes

**Points positifs et négatifs** :
- Doivent contenir : id, content, author, votes, timestamp
- Content : max 200 caractères
- Author : max 30 caractères
- Votes : doit être un nombre

**Actions** :
- Doivent contenir : id, content, author, timestamp
- Pas de champ "votes" (les actions ne sont pas votables)
- Content : max 200 caractères
- Author : max 30 caractères

### Timer

- **timeRemaining** : Nombre de secondes restantes (≥ 0)
- **isRunning** : Boolean indiquant si le timer est actif
- **lastUpdate** : Timestamp de la dernière mise à jour

## 🎯 Permissions côté application

Les permissions sont gérées dans l'application JavaScript :

### Organisateur (OP)
L'utilisateur qui crée la session devient automatiquement l'organisateur.

**Droits exclusifs de l'OP** :
- ✅ Ajouter/supprimer des actions
- ✅ Contrôler le minuteur (démarrer/pause/arrêter)
- ✅ Effacer toutes les données de la session
- ✅ Exporter la rétrospective

### Participants
Les utilisateurs qui rejoignent une session existante.

**Droits des participants** :
- ✅ Ajouter/supprimer des points positifs et négatifs
- ✅ Voter sur les points positifs et négatifs
- ✅ Voir les actions (mais pas les modifier)
- ✅ Voir le minuteur en temps réel (synchronisé)
- ❌ Ne peuvent PAS ajouter/supprimer des actions
- ❌ Ne peuvent PAS voter sur les actions
- ❌ Ne peuvent PAS contrôler le minuteur
- ❌ Ne peuvent PAS effacer la session
- ❌ Ne peuvent PAS exporter

## 🔄 Synchronisation temps réel

### Timer synchronisé

Le minuteur est synchronisé en temps réel entre tous les participants :

1. **OP démarre le timer** → Mis à jour dans Firebase
2. **Firebase notifie** tous les participants
3. **Participants synchronisent** leur affichage local
4. Le décompte est calculé localement en tenant compte du délai réseau

### Cartes temps réel

Toutes les modifications de cartes (ajout, suppression, vote) sont instantanément visibles par tous les participants.

## 📝 Notes de sécurité

### Pourquoi `.write: true` ?

Les règles actuelles permettent à tous d'écrire (`.write: true`). C'est voulu pour simplifier l'usage, mais attention :

**Limitations actuelles** :
- N'importe qui peut modifier n'importe quelle session s'il connaît l'ID
- Les permissions OP/participant sont gérées uniquement côté client

**Pour une sécurité renforcée** (à implémenter si nécessaire) :
- Utiliser Firebase Authentication
- Vérifier l'owner dans les règles de sécurité
- Restreindre les écritures selon le rôle

### ID de session

Les IDs de session sont générés aléatoirement : `retro-XXXXXXX`

**Bonnes pratiques** :
- Ne partagez l'ID qu'avec les membres de votre équipe
- Pour plus de sécurité, créez une nouvelle session pour chaque rétrospective
- Les sessions ne sont pas automatiquement supprimées (gérer manuellement si besoin)

## 🚀 Migration depuis l'ancienne version

Si vous avez des sessions existantes créées avant la v2.0, elles n'auront pas de champ `owner` ou `timer`. L'application gérera automatiquement ces cas :

- Sessions sans owner : Personne ne sera considéré comme OP
- Pour récupérer les droits OP : Créez une nouvelle session
