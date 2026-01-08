# Règles de sécurité Firebase pour Rétrospective

## ⚠️ Important

Après avoir configuré Firebase, vous devez mettre à jour les règles de sécurité dans la console Firebase.

> 🔒 **Mise à jour de sécurité** : Les règles ci-dessous incluent les dernières améliorations de sécurité (immutabilité de l'owner, validation stricte des userId).

## 📋 Règles de sécurité renforcées (v5.0)

Allez dans **Firebase Console** → **Realtime Database** → **Règles** et collez ce JSON :

```json
{
  "rules": {
    "sessions": {
      "$sessionId": {
        ".read": true,
        ".write": true,

        "owner": {
          ".write": "!data.exists()",
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 100 && newData.val().matches(/^user-[a-f0-9]{32}$/) && (!data.exists() || data.val() === newData.val())"
        },

        "phase": {
          ".validate": "newData.isString() && (newData.val() === 'reflexion' || newData.val() === 'regroupement' || newData.val() === 'vote' || newData.val() === 'action')"
        },

        "users": {
          "$userId": {
            ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 30 && $userId.matches(/^user-[a-f0-9]{32}$/)"
          }
        },

        "positive": {
          "$cardId": {
            ".validate": "newData.hasChildren(['id', 'content', 'author', 'votes', 'timestamp']) && newData.child('content').isString() && newData.child('content').val().length > 0 && newData.child('content').val().length <= 300 && newData.child('author').isString() && newData.child('author').val().length > 0 && newData.child('author').val().length <= 30 && newData.child('votes').isNumber() && newData.child('votes').val() >= 0 && newData.child('votes').val() <= 999 && newData.child('timestamp').isNumber() && newData.child('timestamp').val() > 0 && (!newData.child('groupId').exists() || (newData.child('groupId').isString() && newData.child('groupId').val().length > 0 && newData.child('groupId').val().length <= 100))",

            "id": {
              ".validate": "newData.isNumber() && newData.val() > 0"
            },
            "content": {
              ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 300"
            },
            "author": {
              ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 30"
            },
            "votes": {
              ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 999"
            },
            "timestamp": {
              ".validate": "newData.isNumber() && newData.val() > 0"
            },
            "groupId": {
              ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 100"
            },
            "$other": {
              ".validate": false
            }
          }
        },

        "negative": {
          "$cardId": {
            ".validate": "newData.hasChildren(['id', 'content', 'author', 'votes', 'timestamp']) && newData.child('content').isString() && newData.child('content').val().length > 0 && newData.child('content').val().length <= 300 && newData.child('author').isString() && newData.child('author').val().length > 0 && newData.child('author').val().length <= 30 && newData.child('votes').isNumber() && newData.child('votes').val() >= 0 && newData.child('votes').val() <= 999 && newData.child('timestamp').isNumber() && newData.child('timestamp').val() > 0 && (!newData.child('groupId').exists() || (newData.child('groupId').isString() && newData.child('groupId').val().length > 0 && newData.child('groupId').val().length <= 100))",

            "id": {
              ".validate": "newData.isNumber() && newData.val() > 0"
            },
            "content": {
              ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 300"
            },
            "author": {
              ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 30"
            },
            "votes": {
              ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 999"
            },
            "timestamp": {
              ".validate": "newData.isNumber() && newData.val() > 0"
            },
            "groupId": {
              ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 100"
            },
            "$other": {
              ".validate": false
            }
          }
        },

        "action": {
          "$cardId": {
            ".validate": "newData.hasChildren(['id', 'content', 'author', 'timestamp']) && newData.child('content').isString() && newData.child('content').val().length > 0 && newData.child('content').val().length <= 300 && newData.child('author').isString() && newData.child('author').val().length > 0 && newData.child('author').val().length <= 30 && newData.child('timestamp').isNumber() && newData.child('timestamp').val() > 0",

            "id": {
              ".validate": "newData.isNumber() && newData.val() > 0"
            },
            "content": {
              ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 300"
            },
            "author": {
              ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 30"
            },
            "timestamp": {
              ".validate": "newData.isNumber() && newData.val() > 0"
            },
            "$other": {
              ".validate": false
            }
          }
        },

        "timer": {
          "timeRemaining": {
            ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 86400"
          },
          "isRunning": {
            ".validate": "newData.isBoolean()"
          },
          "lastUpdate": {
            ".validate": "newData.isNumber() && newData.val() > 0"
          },
          "$other": {
            ".validate": false
          }
        },

        "$other": {
          ".validate": false
        }
      }
    },

    "$other": {
      ".validate": false
    }
  }
}
```

## 🔐 Explication des règles

### Structure de session

Chaque session contient :
- **owner** : ID de l'organisateur (OP) de la session
- **phase** : Phase actuelle du workflow ('reflexion', 'regroupement', 'vote', ou 'action')
- **users** : Liste des participants { userId: userName } pour prévenir l'usurpation d'identité
- **positive** : Cartes des points positifs (avec groupId optionnel)
- **negative** : Cartes des points à améliorer (avec groupId optionnel)
- **action** : Cartes d'actions (OP uniquement)
- **timer** : État du minuteur synchronisé

### Validation de la phase

**phase** :
- Doit être l'une des quatre valeurs : 'reflexion', 'regroupement', 'vote', ou 'action'
- Contrôle le workflow de la rétrospective
- Seul l'OP peut modifier cette valeur (validation côté application)
- Synchronisé en temps réel pour tous les participants

### Validation des participants

**users** :
- Chaque userId est associé à un nom d'utilisateur
- Le nom doit être une chaîne non vide
- Maximum 30 caractères
- Empêche deux participants différents d'avoir le même nom

### Validation des cartes

**Points positifs et négatifs** :
- Doivent contenir : id, content, author, votes, timestamp
- **id** : Doit être un nombre positif (> 0)
- **content** : Chaîne de caractères non vide, min 1 et max 300 caractères
- **author** : Chaîne de caractères non vide, min 1 et max 30 caractères
- **votes** : Nombre entre 0 et 999 (limite max de votes)
- **timestamp** : Nombre positif (> 0) représentant la date de création
- **groupId** : Optionnel, chaîne de caractères (1-100 caractères) pour le regroupement de cartes
- **$other** : Tous les autres champs sont rejetés (sécurité stricte)

**Actions** :
- Doivent contenir : id, content, author, timestamp
- **id** : Doit être un nombre positif (> 0)
- **content** : Chaîne de caractères non vide, min 1 et max 300 caractères
- **author** : Chaîne de caractères non vide, min 1 et max 30 caractères
- **timestamp** : Nombre positif (> 0) représentant la date de création
- Pas de champ "votes" (les actions ne sont pas votables)
- Pas de champ "groupId" (les actions ne peuvent pas être regroupées)
- **$other** : Tous les autres champs sont rejetés (sécurité stricte)

### Timer

- **timeRemaining** : Nombre de secondes restantes (entre 0 et 86400 = 24h max)
- **isRunning** : Boolean indiquant si le timer est actif
- **lastUpdate** : Nombre positif (> 0) représentant le timestamp de la dernière mise à jour
- **$other** : Tous les autres champs sont rejetés (sécurité stricte)

### Sécurité Renforcée (v5.0)

Les règles ont été considérablement renforcées pour bloquer les injections et abus :

#### Protections de validation des données (v4.2.0)

✅ **Validation de type stricte** : Tous les champs sont validés par type (isString, isNumber, isBoolean)
✅ **Validation de longueur** : Min/max sur tous les champs de texte
✅ **Validation de plage** : Min/max sur tous les nombres (votes ≤ 999, timer ≤ 24h)
✅ **Timestamps positifs** : Tous les timestamps doivent être > 0
✅ **Rejet des champs inconnus** : `"$other": { ".validate": false }` rejette tous les champs non prévus
✅ **Validation imbriquée** : Validation au niveau racine ET au niveau des sous-champs

#### Nouvelles protections anti-usurpation (v5.0)

🔒 **Protection de l'owner** :
- `.validate: "(!data.exists() || data.val() === newData.val())"` → Le champ `owner` ne peut **jamais être modifié** une fois défini
- La validation permet la création initiale mais empêche toute modification ultérieure
- Validation du format : seuls les userId générés par `crypto.getRandomValues()` sont acceptés (`user-[32 hex chars]`)
- Mécanisme d'immutabilité : le nouvel owner doit être identique à l'ancien (impossible de changer)

🔒 **Validation stricte des userId** :
- Format obligatoire : `user-[a-f0-9]{32}$` (exactement 32 caractères hexadécimaux minuscules)
- Empêche les userId personnalisés ou fantaisistes (`admin`, `root`, `user-123`, etc.)
- Garantit que seuls les ID générés de manière cryptographiquement sécurisée sont utilisés

**Exemples de rejets automatiques :**

```javascript
// ❌ REJETÉ : tentative de modification de l'owner existant
await update(sessionRef, { owner: 'user-hacker123...' });
// Error: Validation failed (owner cannot be changed)

// ❌ REJETÉ : userId au mauvais format
const usersRef = ref(db, 'sessions/retro-abc/users/admin');
await set(usersRef, 'Hacker');
// Error: Validation failed (userId doesn't match pattern)

// ❌ REJETÉ : owner avec format invalide
await set(sessionRef, { owner: 'user-ABCD1234...' });
// Error: Validation failed (uppercase not allowed)

// ❌ REJETÉ : votes trop élevé (> 999)
{ votes: 10000 }

// ❌ REJETÉ : contenu vide
{ content: "" }

// ❌ REJETÉ : timestamp invalide (≤ 0)
{ timestamp: -1 }

// ❌ REJETÉ : champ non autorisé
{ content: "test", maliciousField: "hack" }

// ✅ ACCEPTÉ : toutes les validations passent
{
  owner: "user-a1b2c3d4e5f6789012345678901234567",
  id: 123,
  content: "Bonne idée",
  author: "Alice",
  votes: 5,
  timestamp: 1704700000000
}
```

## 🎯 Permissions côté application

Les permissions sont gérées dans l'application JavaScript :

### Organisateur (OP)
L'utilisateur qui crée la session devient automatiquement l'organisateur.

**Droits exclusifs de l'OP** :
- ✅ Ajouter/supprimer des actions
- ✅ Regrouper/dégrouper des cartes (phase Regroupement)
- ✅ Changer de phase (workflow)
- ✅ Supprimer toutes les cartes en phase Vote
- ✅ Contrôler le minuteur (démarrer/pause/arrêter)
- ✅ Effacer toutes les données de la session
- ✅ Exporter la rétrospective

### Participants
Les utilisateurs qui rejoignent une session existante.

**Droits des participants** :
- ✅ Ajouter des points positifs et négatifs (phase Réflexion uniquement)
- ✅ Supprimer leurs propres cartes (phase Réflexion uniquement)
- ✅ Voter sur les points positifs, négatifs et groupes (phase Vote uniquement)
- ✅ Voir les groupes de cartes créés par l'OP
- ✅ Voir les actions (mais pas les modifier)
- ✅ Voir le minuteur en temps réel (synchronisé)
- ❌ Ne peuvent PAS ajouter/supprimer des actions
- ❌ Ne peuvent PAS regrouper/dégrouper des cartes
- ❌ Ne peuvent PAS voter sur les actions
- ❌ Ne peuvent PAS supprimer de cartes en phase Regroupement ou Vote
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

Si vous avez des sessions existantes créées avant la v4.0, elles n'auront pas de champ `owner`, `phase` ou `timer`. L'application gérera automatiquement ces cas :

- Sessions sans owner : Personne ne sera considéré comme OP
- Sessions sans phase : La phase par défaut sera 'reflexion'
- Pour bénéficier du workflow complet : Créez une nouvelle session
