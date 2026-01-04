# Migration vers la version 3.0

## 🆕 Qu'est-ce qui change ?

La version 3.0 introduit un **système de permissions** avec deux rôles distincts :
- **Organisateur (OP)** : Celui qui crée la session
- **Participants** : Ceux qui rejoignent la session

## 📋 Actions requises

### 1. Mettre à jour les règles Firebase

⚠️ **IMPORTANT** : Vous devez mettre à jour vos règles de sécurité Firebase pour que le timer fonctionne correctement.

1. Allez dans **Firebase Console** → **Realtime Database** → **Règles**
2. Remplacez les règles existantes par celles du fichier [FIREBASE_RULES.md](FIREBASE_RULES.md)
3. Cliquez sur **Publier**

### 2. Comprendre les nouveaux rôles

**Si vous créez une session** :
- Vous êtes automatiquement l'**Organisateur**
- Vous avez tous les droits (actions, timer, export, suppression)
- Vous pouvez supprimer toutes les cartes de tous les utilisateurs
- Vous disposez de 3 votes comme tout le monde

**Si vous rejoignez une session** :
- Vous êtes un **Participant**
- Vous pouvez ajouter des points positifs/négatifs
- Vous pouvez supprimer uniquement vos propres cartes
- Vous disposez de **3 votes maximum** pour prioriser les sujets
- Vous ne pouvez PAS ajouter d'actions ni contrôler le timer

### 3. Sessions existantes

Les sessions créées avec les versions antérieures n'auront pas de propriétaire défini.

**Solution** : Créez une nouvelle session pour chaque rétrospective.

## 🎯 Nouvelles fonctionnalités

### Timer synchronisé

Le minuteur est maintenant synchronisé en temps réel entre tous les participants :
- L'OP démarre/arrête le timer (bouton Pause supprimé en v3.1)
- Tous les participants voient le même décompte
- Pas de désynchronisation, même avec de la latence réseau
- Trois presets disponibles : 5, 7 et 10 minutes

### Actions réservées à l'OP

Les actions sont maintenant un espace réservé à l'organisateur :
- Plus adapté pour définir les prochaines étapes
- Les participants voient les actions mais ne peuvent pas les modifier
- Pas de votes sur les actions (simplifie l'interface)

### Quota de votes (v3.1)

Chaque utilisateur dispose d'un quota limité de votes :
- **3 votes maximum** par utilisateur
- Compteur affiché dans le bandeau supérieur
- Mise à jour en temps réel après chaque vote
- Message d'erreur si quota atteint

### Suppression basée sur l'auteur (v3.1)

Nouvelles règles de suppression pour améliorer la collaboration :
- Les **participants** ne peuvent supprimer que leurs propres cartes
- L'**OP** peut supprimer toutes les cartes de tous les utilisateurs
- Messages d'erreur clairs si tentative non autorisée

### UI adaptative

L'interface s'adapte automatiquement selon votre rôle :
- Boutons masqués si vous n'avez pas la permission
- Messages d'erreur clairs si vous essayez une action non autorisée
- Input des actions désactivé pour les participants
- Section de session masquée après connexion (v3.1)
- ID de session affiché dans le bandeau supérieur (v3.1)
- Compteur de votes visible pour tous (v3.1)

## ❓ FAQ

### Comment savoir si je suis l'organisateur ?

- Vous voyez les boutons "Effacer", "Exporter" et les contrôles du timer
- L'input des actions est actif
- Vous pouvez ajouter des actions
- Vous pouvez supprimer toutes les cartes (pas seulement les vôtres)

### Je veux donner les droits OP à quelqu'un d'autre

Ce n'est pas possible actuellement. L'organisateur est toujours celui qui crée la session.

**Solution** : La personne désirée doit créer la session, puis partager l'ID.

### Puis-je avoir plusieurs organisateurs ?

Non, il n'y a qu'un seul organisateur par session (celui qui la crée).

### Les participants peuvent-ils voir qui est l'OP ?

Non, cette information n'est pas affichée dans l'interface. Seul le comportement de l'UI change.

### Comment révoquer l'accès à une session ?

Actuellement, si quelqu'un a l'ID de session, il peut y accéder.

**Solutions** :
- Créez une nouvelle session pour chaque rétrospective
- Ne partagez l'ID qu'avec les membres de votre équipe
- Effacez les données avec le bouton "Tout effacer" après la rétro

## 🐛 Problèmes connus

### Le timer ne se synchronise pas

**Cause** : Les règles Firebase n'ont pas été mises à jour.

**Solution** : Suivez l'étape 1 ci-dessus pour mettre à jour les règles.

### Je ne peux plus ajouter d'actions

**Cause** : Vous avez rejoint une session existante au lieu de la créer.

**Solution** :
- Si vous devez être l'organisateur, créez une nouvelle session
- Sinon, demandez à l'organisateur d'ajouter les actions pour vous

### Je ne peux plus voter

**Cause** : Vous avez utilisé vos 3 votes.

**Solution** :
- Chaque utilisateur dispose de 3 votes maximum
- C'est une limite volontaire pour encourager la priorisation
- Créez une nouvelle session pour réinitialiser vos votes

### Je ne peux pas supprimer une carte

**Cause** : Vous essayez de supprimer une carte qui n'a pas été créée par vous.

**Solution** :
- En tant que participant, vous ne pouvez supprimer que vos propres cartes
- Demandez à l'organisateur de supprimer la carte si nécessaire
- Ou demandez à l'auteur de la carte de la supprimer

### Les boutons sont cachés alors que j'ai créé la session

**Cause possible** : Vous avez effacé le localStorage de votre navigateur.

**Solution** : Créez une nouvelle session. Votre ID utilisateur a été réinitialisé.

## 💡 Conseils

1. **Créez toujours une nouvelle session** pour chaque rétrospective
2. **L'organisateur** devrait être le Scrum Master ou celui qui anime la rétro
3. **Partagez l'ID** uniquement avec les membres de l'équipe
4. **Exportez les données** à la fin de chaque rétro (OP uniquement)
5. **Effacez les données** après export pour garder Firebase propre

## 📞 Support

Des questions ? Consultez :
- [README.md](README.md) - Guide d'utilisation complet
- [FIREBASE_RULES.md](FIREBASE_RULES.md) - Documentation des règles de sécurité
- [ARCHITECTURE.md](ARCHITECTURE.md) - Documentation technique
