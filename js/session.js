import { ref, set, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

/**
 * Module de gestion des sessions de rétrospective
 */

let db = null;
let currentSessionRef = null;
let currentSessionId = null;
let listeners = [];

/**
 * Initialise le module avec la référence à la base de données
 */
export function initialize(database) {
    db = database;
}

/**
 * Génère un ID de session unique
 */
function generateSessionId() {
    return 'retro-' + Math.random().toString(36).substring(2, 9);
}

/**
 * Crée une nouvelle session
 */
export async function createNewSession() {
    if (!db) {
        throw new Error('Firebase non initialisé');
    }

    currentSessionId = generateSessionId();
    currentSessionRef = ref(db, `sessions/${currentSessionId}`);

    const initialData = { positive: {}, negative: {}, action: {} };

    try {
        await set(currentSessionRef, initialData);
        return currentSessionId;
    } catch (error) {
        console.error('Erreur lors de la création de la session:', error);
        throw error;
    }
}

/**
 * Rejoint une session existante
 */
export function joinSession(sessionId) {
    if (!db) {
        throw new Error('Firebase non initialisé');
    }

    if (!sessionId || !sessionId.trim()) {
        throw new Error('ID de session invalide');
    }

    currentSessionId = sessionId.trim();
    currentSessionRef = ref(db, `sessions/${currentSessionId}`);

    return currentSessionId;
}

/**
 * Récupère l'ID de la session courante
 */
export function getCurrentSessionId() {
    return currentSessionId;
}

/**
 * Récupère la référence de la session courante
 */
export function getCurrentSessionRef() {
    return currentSessionRef;
}

/**
 * Configure un listener temps réel pour un type de carte
 */
export function setupRealtimeListener(type, callback) {
    if (!currentSessionRef) {
        throw new Error('Aucune session active');
    }

    const typeRef = ref(db, `sessions/${currentSessionId}/${type}`);
    const unsubscribe = onValue(typeRef, callback);

    listeners.push({ type, unsubscribe });
    return unsubscribe;
}

/**
 * Efface toutes les données de la session courante
 */
export async function clearSession() {
    if (!currentSessionRef) {
        throw new Error('Aucune session active');
    }

    const confirmMessage = '⚠️ Supprimer toutes les données de cette session ?';
    if (!confirm(confirmMessage)) {
        return false;
    }

    try {
        const emptyData = { positive: {}, negative: {}, action: {} };
        await set(currentSessionRef, emptyData);
        return true;
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        throw error;
    }
}

/**
 * Exporte les données de la session courante
 */
export function exportSession(callback) {
    if (!currentSessionRef) {
        throw new Error('Aucune session active');
    }

    onValue(currentSessionRef, (snapshot) => {
        const data = snapshot.val();
        const exportObj = {
            sessionId: currentSessionId,
            date: new Date().toISOString(),
            retrospective: data
        };
        callback(exportObj);
    }, { onlyOnce: true });
}

/**
 * Nettoie tous les listeners
 */
export function cleanup() {
    listeners.forEach(({ unsubscribe }) => unsubscribe());
    listeners = [];
    currentSessionRef = null;
    currentSessionId = null;
}
