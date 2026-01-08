import { ref, set, push, remove, update, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getCurrentSessionId, getCurrentUserName, isSessionOwner, canVote, incrementVotesUsed, getCurrentPhase } from './session.js';

/**
 * Module de gestion des cartes de rétrospective
 */

let db = null;

/**
 * Initialise le module avec la référence à la base de données
 */
export function initialize(database) {
    db = database;
}

/**
 * Récupère le nom de l'utilisateur depuis la session
 */
function getUserName() {
    const name = getCurrentUserName();
    return name || 'Anonyme';
}

/**
 * Ajoute une nouvelle carte
 * Pour les actions : OP uniquement
 */
export async function addCard(type, content) {
    const sessionId = getCurrentSessionId();
    if (!sessionId) {
        throw new Error('Aucune session active');
    }

    const currentPhase = getCurrentPhase();

    // Bloquer l'ajout de cartes positives/négatives après la phase de réflexion
    if (type !== 'action' && currentPhase !== 'reflexion') {
        throw new Error('Vous ne pouvez ajouter des cartes qu\'en phase de réflexion');
    }

    // Bloquer l'ajout d'actions sauf en phase action
    if (type === 'action' && currentPhase !== 'action') {
        throw new Error('Vous ne pouvez ajouter des actions qu\'en phase Actions');
    }

    // Vérifier les permissions pour les actions
    if (type === 'action' && !isSessionOwner()) {
        throw new Error('Seul l\'organisateur peut ajouter des actions');
    }

    if (!content || content.trim().length === 0) {
        return;
    }

    if (content.length > 300) {
        throw new Error('Le contenu ne peut pas dépasser 300 caractères');
    }

    const card = {
        id: Date.now() + Math.random(),
        content: content.trim().substring(0, 300),
        author: getUserName(),
        timestamp: Date.now()
    };

    // Ajouter le champ votes uniquement pour les points positifs et négatifs
    if (type !== 'action') {
        card.votes = 0;
    }

    const typeRef = ref(db, `sessions/${sessionId}/${type}`);
    const newCardRef = push(typeRef);

    try {
        await set(newCardRef, card);
        return card;
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la carte:', error);
        throw error;
    }
}

/**
 * Supprime une carte
 * Pour les actions : OP uniquement
 * Pour les autres : auteur ou OP uniquement
 */
export async function deleteCard(type, key, cardAuthor, showConfirmCallback) {
    const sessionId = getCurrentSessionId();
    if (!sessionId) {
        throw new Error('Aucune session active');
    }

    const currentPhase = getCurrentPhase();
    const isOwner = isSessionOwner();
    const currentUser = getUserName();

    // Bloquer la suppression des cartes positives/négatives en phase Actions
    if (type !== 'action' && currentPhase === 'action') {
        throw new Error('Vous ne pouvez plus supprimer de cartes en phase Actions');
    }

    // Vérifier les permissions pour les actions
    if (type === 'action' && !isOwner) {
        throw new Error('Seul l\'organisateur peut supprimer des actions');
    }

    // Pour les points positifs/négatifs : vérifier l'auteur sauf si OP
    if (type !== 'action' && !isOwner && cardAuthor !== currentUser) {
        throw new Error('Vous ne pouvez supprimer que vos propres cartes');
    }

    const confirmed = await showConfirmCallback('Supprimer cette carte ?');
    if (!confirmed) {
        return false;
    }

    const cardRef = ref(db, `sessions/${sessionId}/${type}/${key}`);

    try {
        await remove(cardRef);
        return true;
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        throw error;
    }
}

/**
 * Ajoute un vote à une carte ou à un groupe
 * Les actions ne peuvent pas être votées
 */
export async function voteCard(type, key, currentVotes = 0, isGroup = false, groupId = null) {
    const sessionId = getCurrentSessionId();
    if (!sessionId) {
        throw new Error('Aucune session active');
    }

    const currentPhase = getCurrentPhase();

    // Bloquer les votes en dehors de la phase de vote
    if (currentPhase !== 'vote') {
        throw new Error('Vous ne pouvez voter qu\'en phase de Vote');
    }

    // Empêcher le vote sur les actions
    if (type === 'action') {
        throw new Error('Les actions ne peuvent pas être votées');
    }

    // Vérifier la limite de votes
    if (!canVote()) {
        throw new Error('Vous avez utilisé vos 3 votes');
    }

    try {
        // Vote sur une carte individuelle (même si c'est un groupe, on vote sur la première carte)
        const cardRef = ref(db, `sessions/${sessionId}/${type}/${key}`);
        await update(cardRef, { votes: currentVotes + 1 });

        incrementVotesUsed();
        return currentVotes + 1;
    } catch (error) {
        console.error('Erreur lors du vote:', error);
        throw error;
    }
}

/**
 * Génère un ID de groupe unique
 */
function generateGroupId() {
    return 'group-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

/**
 * Regroupe une carte avec une autre carte ou un groupe
 */
export async function groupCards(type, draggedCardKey, targetCardKey) {
    const sessionId = getCurrentSessionId();
    if (!sessionId) {
        throw new Error('Aucune session active');
    }

    if (!isSessionOwner()) {
        throw new Error('Seul l\'organisateur peut regrouper des cartes');
    }

    const currentPhase = getCurrentPhase();
    if (currentPhase !== 'regroupement') {
        throw new Error('Le regroupement n\'est possible qu\'en phase Regroupement');
    }

    if (type === 'action') {
        throw new Error('Les actions ne peuvent pas être regroupées');
    }

    const draggedCardRef = ref(db, `sessions/${sessionId}/${type}/${draggedCardKey}`);
    const targetCardRef = ref(db, `sessions/${sessionId}/${type}/${targetCardKey}`);

    try {
        // Récupérer les cartes
        const [draggedSnapshot, targetSnapshot] = await Promise.all([
            new Promise((resolve) => onValue(draggedCardRef, resolve, { onlyOnce: true })),
            new Promise((resolve) => onValue(targetCardRef, resolve, { onlyOnce: true }))
        ]);

        const draggedCard = draggedSnapshot.val();
        const targetCard = targetSnapshot.val();

        if (!draggedCard || !targetCard) {
            throw new Error('Carte introuvable');
        }

        // Déterminer le groupId à utiliser
        let groupId;
        if (targetCard.groupId) {
            // La cible fait déjà partie d'un groupe
            groupId = targetCard.groupId;
        } else {
            // Créer un nouveau groupe
            groupId = generateGroupId();
            // Assigner le groupId à la carte cible
            await update(targetCardRef, { groupId });
        }

        // Assigner le groupId à la carte glissée
        await update(draggedCardRef, { groupId });

        return groupId;
    } catch (error) {
        console.error('Erreur lors du regroupement:', error);
        throw error;
    }
}

/**
 * Retire une carte d'un groupe
 */
export async function ungroupCard(type, cardKey) {
    const sessionId = getCurrentSessionId();
    if (!sessionId) {
        throw new Error('Aucune session active');
    }

    if (!isSessionOwner()) {
        throw new Error('Seul l\'organisateur peut dégrouper des cartes');
    }

    const currentPhase = getCurrentPhase();
    if (currentPhase !== 'regroupement') {
        throw new Error('Le dégroupement n\'est possible qu\'en phase Regroupement');
    }

    const cardRef = ref(db, `sessions/${sessionId}/${type}/${cardKey}`);

    try {
        await update(cardRef, { groupId: null });
        return true;
    } catch (error) {
        console.error('Erreur lors du dégroupement:', error);
        throw error;
    }
}

/**
 * Dégrouper toutes les cartes d'un groupe
 */
export async function ungroupAll(type, groupId) {
    const sessionId = getCurrentSessionId();
    if (!sessionId) {
        throw new Error('Aucune session active');
    }

    if (!isSessionOwner()) {
        throw new Error('Seul l\'organisateur peut dégrouper des cartes');
    }

    const currentPhase = getCurrentPhase();
    if (currentPhase !== 'regroupement') {
        throw new Error('Le dégroupement n\'est possible qu\'en phase Regroupement');
    }

    const typeRef = ref(db, `sessions/${sessionId}/${type}`);

    try {
        // Récupérer toutes les cartes du type
        const snapshot = await new Promise((resolve) =>
            onValue(typeRef, resolve, { onlyOnce: true })
        );

        const data = snapshot.val() || {};
        const updates = {};

        // Trouver toutes les cartes du groupe et préparer les mises à jour
        Object.entries(data).forEach(([cardKey, card]) => {
            if (card.groupId === groupId) {
                updates[`${cardKey}/groupId`] = null;
            }
        });

        // Appliquer toutes les mises à jour en une seule opération
        await update(typeRef, updates);
        return true;
    } catch (error) {
        console.error('Erreur lors du dégroupement:', error);
        throw error;
    }
}

/**
 * Récupère toutes les cartes d'un groupe
 */
export function getCardsInGroup(cards, groupId) {
    return cards.filter(card => card.groupId === groupId);
}

/**
 * Organise les cartes en groupes
 * Retourne un tableau où chaque élément est soit une carte seule, soit un groupe de cartes
 */
export function organizeCardsIntoGroups(cards) {
    const groups = {};
    const standalone = [];

    cards.forEach(card => {
        if (card.groupId) {
            if (!groups[card.groupId]) {
                groups[card.groupId] = [];
            }
            groups[card.groupId].push(card);
        } else {
            standalone.push(card);
        }
    });

    // Convertir les groupes en tableau et trier les cartes dans chaque groupe
    const groupArrays = Object.entries(groups).map(([groupId, groupCards]) => ({
        isGroup: true,
        groupId,
        cards: groupCards.sort((a, b) => a.timestamp - b.timestamp), // Première carte = celle ajoutée en premier
        votes: groupCards.reduce((sum, card) => sum + (card.votes || 0), 0), // Total des votes
        timestamp: Math.min(...groupCards.map(c => c.timestamp)) // Timestamp le plus ancien
    }));

    // Combiner et trier par votes décroissants
    const allItems = [...groupArrays, ...standalone.map(card => ({ isGroup: false, ...card }))];
    return allItems.sort((a, b) => (b.votes || 0) - (a.votes || 0));
}

/**
 * Filtre les cartes selon la phase actuelle
 */
export function filterCardsByPhase(cards, type) {
    // Ne pas filtrer les actions
    if (type === 'action') {
        return cards;
    }

    const currentPhase = getCurrentPhase();
    if (currentPhase === 'reflexion') {
        // En phase de réflexion, afficher uniquement ses propres cartes
        const currentUserName = getCurrentUserName();
        return cards.filter(card => card.author === currentUserName);
    }

    // Dans les autres phases, afficher toutes les cartes
    return cards;
}

/**
 * Récupère toutes les cartes d'un type avec un listener temps réel
 * En phase "reflexion", filtre pour n'afficher que les cartes de l'utilisateur actuel
 * Accepte un second callback optionnel qui reçoit les cartes brutes (avant filtrage)
 */
export function watchCards(type, callbackFiltered, callbackRaw = null) {
    const sessionId = getCurrentSessionId();
    if (!sessionId) {
        throw new Error('Aucune session active');
    }

    const typeRef = ref(db, `sessions/${sessionId}/${type}`);

    return onValue(typeRef, (snapshot) => {
        const data = snapshot.val() || {};
        const rawCards = Object.entries(data)
            .map(([key, card]) => ({ ...card, key }))
            .sort((a, b) => (b.votes || 0) - (a.votes || 0));

        // Appeler le callback avec les cartes brutes si fourni
        if (callbackRaw) {
            callbackRaw(rawCards);
        }

        // Filtrer les cartes selon la phase
        const filteredCards = filterCardsByPhase(rawCards, type);

        // Appeler le callback avec les cartes filtrées
        callbackFiltered(filteredCards);
    });
}
