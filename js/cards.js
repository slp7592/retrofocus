import { ref, set, push, remove, update, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getCurrentSessionId, isSessionOwner, canVote, incrementVotesUsed } from './session.js';

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
 * Récupère le nom de l'utilisateur depuis l'input
 */
function getUserName() {
    const input = document.getElementById('userName');
    if (!input) return 'Anonyme';

    let name = input.value.trim();
    return name ? name.substring(0, 30) : 'Anonyme';
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

    // Vérifier les permissions pour les actions
    if (type === 'action' && !isSessionOwner()) {
        throw new Error('Seul l\'organisateur peut ajouter des actions');
    }

    if (!content || content.trim().length === 0) {
        return;
    }

    if (content.length > 200) {
        throw new Error('Le contenu ne peut pas dépasser 200 caractères');
    }

    const card = {
        id: Date.now() + Math.random(),
        content: content.trim().substring(0, 200),
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
export async function deleteCard(type, key, cardAuthor) {
    const sessionId = getCurrentSessionId();
    if (!sessionId) {
        throw new Error('Aucune session active');
    }

    const isOwner = isSessionOwner();
    const currentUser = getUserName();

    // Vérifier les permissions pour les actions
    if (type === 'action' && !isOwner) {
        throw new Error('Seul l\'organisateur peut supprimer des actions');
    }

    // Pour les points positifs/négatifs : vérifier l'auteur sauf si OP
    if (type !== 'action' && !isOwner && cardAuthor !== currentUser) {
        throw new Error('Vous ne pouvez supprimer que vos propres cartes');
    }

    if (!confirm('Supprimer cette carte ?')) {
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
 * Ajoute un vote à une carte
 * Les actions ne peuvent pas être votées
 */
export async function voteCard(type, key, currentVotes = 0) {
    const sessionId = getCurrentSessionId();
    if (!sessionId) {
        throw new Error('Aucune session active');
    }

    // Empêcher le vote sur les actions
    if (type === 'action') {
        throw new Error('Les actions ne peuvent pas être votées');
    }

    // Vérifier la limite de votes
    if (!canVote()) {
        throw new Error('Vous avez utilisé vos 3 votes');
    }

    const cardRef = ref(db, `sessions/${sessionId}/${type}/${key}`);

    try {
        await update(cardRef, { votes: currentVotes + 1 });
        incrementVotesUsed();
        return currentVotes + 1;
    } catch (error) {
        console.error('Erreur lors du vote:', error);
        throw error;
    }
}

/**
 * Récupère toutes les cartes d'un type avec un listener temps réel
 */
export function watchCards(type, callback) {
    const sessionId = getCurrentSessionId();
    if (!sessionId) {
        throw new Error('Aucune session active');
    }

    const typeRef = ref(db, `sessions/${sessionId}/${type}`);

    return onValue(typeRef, (snapshot) => {
        const data = snapshot.val() || {};
        const cards = Object.entries(data)
            .map(([key, card]) => ({ ...card, key }))
            .sort((a, b) => (b.votes || 0) - (a.votes || 0));

        callback(cards);
    });
}
