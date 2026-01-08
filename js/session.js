import { ref, set, onValue, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

/**
 * Module de gestion des sessions de rétrospective
 */

let db = null;
let currentSessionRef = null;
let currentSessionId = null;
let currentUserId = null;
let currentUserName = null;
let isOwner = false;
let currentPhase = 'reflexion'; // reflexion, vote, action
let listeners = [];
let votesUsed = 0;
const MAX_VOTES = 3;

/**
 * Initialise le module avec la référence à la base de données
 */
export function initialize(database) {
    db = database;
}

/**
 * Génère un ID de session sécurisé avec crypto.getRandomValues()
 * Format: retro-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (32 caractères hex)
 */
function generateSessionId() {
    // Utiliser crypto.getRandomValues pour un vrai aléatoire cryptographique
    const array = new Uint8Array(16); // 16 bytes = 32 caractères hex
    crypto.getRandomValues(array);

    const randomHex = Array.from(array, byte =>
        byte.toString(16).padStart(2, '0')
    ).join('');

    return 'retro-' + randomHex;
}

/**
 * Génère un ID utilisateur sécurisé avec crypto.getRandomValues()
 * Format: user-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (32 caractères hex)
 */
function generateUserId() {
    const array = new Uint8Array(16); // 16 bytes = 32 caractères hex
    crypto.getRandomValues(array);

    const randomHex = Array.from(array, byte =>
        byte.toString(16).padStart(2, '0')
    ).join('');

    return 'user-' + randomHex;
}

/**
 * Récupère ou crée un ID utilisateur depuis le localStorage
 */
function getUserId() {
    let userId = localStorage.getItem('retrofocus_userId');
    if (!userId) {
        userId = generateUserId();
        localStorage.setItem('retrofocus_userId', userId);
    }
    return userId;
}

/**
 * Crée une nouvelle session
 */
export async function createNewSession(userName) {
    if (!db) {
        throw new Error('Firebase non initialisé');
    }

    if (!userName || !userName.trim()) {
        throw new Error('Veuillez entrer un nom d\'utilisateur');
    }

    currentSessionId = generateSessionId();
    currentSessionRef = ref(db, `sessions/${currentSessionId}`);
    currentUserId = getUserId();
    currentUserName = userName.trim().substring(0, 30);
    isOwner = true;

    const initialData = {
        owner: currentUserId,
        phase: 'reflexion',
        users: {
            [currentUserId]: currentUserName
        },
        timer: {
            timeRemaining: 0,
            isRunning: false,
            lastUpdate: Date.now()
        }
    };

    // LOG DEBUG: Afficher les données envoyées
    console.log('🔍 DEBUG - Données envoyées à Firebase:', {
        sessionId: currentSessionId,
        userId: currentUserId,
        userIdLength: currentUserId.length,
        userIdFormat: /^user-[a-f0-9]{32}$/.test(currentUserId) ? '✅ Format OK' : '❌ Format invalide',
        userName: currentUserName,
        initialData
    });

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
export async function joinSession(sessionId, userName) {
    if (!db) {
        throw new Error('Firebase non initialisé');
    }

    if (!sessionId || !sessionId.trim()) {
        throw new Error('ID de session invalide');
    }

    if (!userName || !userName.trim()) {
        throw new Error('Veuillez entrer un nom d\'utilisateur');
    }

    currentSessionId = sessionId.trim();
    currentSessionRef = ref(db, `sessions/${currentSessionId}`);
    currentUserId = getUserId();
    const trimmedUserName = userName.trim().substring(0, 30);

    // Vérifier si le nom est disponible
    return new Promise((resolve, reject) => {
        onValue(currentSessionRef, async (snapshot) => {
            const data = snapshot.val();

            if (!data) {
                reject(new Error('Session introuvable'));
                return;
            }

            // Vérifier si l'utilisateur est le propriétaire
            isOwner = (data.owner === currentUserId);

            // Récupérer la phase actuelle
            currentPhase = data.phase || 'reflexion';

            // Récupérer la liste des utilisateurs
            const users = data.users || {};

            // Vérifier si le nom est déjà pris par un autre userId
            const existingUserWithSameName = Object.entries(users).find(
                ([uid, name]) => name === trimmedUserName && uid !== currentUserId
            );

            if (existingUserWithSameName) {
                reject(new Error(`Le nom "${trimmedUserName}" est déjà utilisé par un autre participant`));
                return;
            }

            // Ajouter l'utilisateur à la liste
            currentUserName = trimmedUserName;
            const usersRef = ref(db, `sessions/${currentSessionId}/users/${currentUserId}`);

            try {
                await set(usersRef, currentUserName);
                resolve(currentSessionId);
            } catch (error) {
                reject(error);
            }
        }, { onlyOnce: true }, (error) => {
            reject(error);
        });
    });
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
 * Vérifie si l'utilisateur actuel est le propriétaire de la session
 */
export function isSessionOwner() {
    return isOwner;
}

/**
 * Récupère l'ID de l'utilisateur actuel
 */
export function getCurrentUserId() {
    return currentUserId;
}

/**
 * Récupère le nom de l'utilisateur actuel
 */
export function getCurrentUserName() {
    return currentUserName;
}

/**
 * Récupère le nombre de votes utilisés
 */
export function getVotesUsed() {
    return votesUsed;
}

/**
 * Récupère le nombre de votes restants
 */
export function getVotesRemaining() {
    return MAX_VOTES - votesUsed;
}

/**
 * Incrémente le compteur de votes
 */
export function incrementVotesUsed() {
    votesUsed++;
}

/**
 * Vérifie si l'utilisateur peut encore voter
 */
export function canVote() {
    return votesUsed < MAX_VOTES;
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
 * Efface toutes les données de la session courante (OP uniquement)
 */
export async function clearSession(showConfirmCallback) {
    if (!currentSessionRef) {
        throw new Error('Aucune session active');
    }

    if (!isOwner) {
        throw new Error('Seul l\'organisateur peut effacer la session');
    }

    const confirmMessage = 'Supprimer toutes les données de cette session ?';
    const confirmed = await showConfirmCallback(confirmMessage);

    if (!confirmed) {
        return false;
    }

    try {
        const emptyData = {
            owner: currentUserId,
            positive: {},
            negative: {},
            action: {},
            timer: {
                timeRemaining: 0,
                isRunning: false,
                lastUpdate: Date.now()
            }
        };
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
 * Met à jour l'état du timer dans Firebase (OP uniquement)
 */
export async function updateTimerState(timeRemaining, isRunning) {
    if (!currentSessionRef) {
        throw new Error('Aucune session active');
    }

    if (!isOwner) {
        throw new Error('Seul l\'organisateur peut contrôler le timer');
    }

    const timerRef = ref(db, `sessions/${currentSessionId}/timer`);
    try {
        await update(timerRef, {
            timeRemaining,
            isRunning,
            lastUpdate: Date.now()
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du timer:', error);
        throw error;
    }
}

/**
 * Configure un listener pour le timer
 */
export function watchTimer(callback) {
    if (!currentSessionRef) {
        throw new Error('Aucune session active');
    }

    const timerRef = ref(db, `sessions/${currentSessionId}/timer`);
    const unsubscribe = onValue(timerRef, (snapshot) => {
        const timerData = snapshot.val();
        if (timerData) {
            callback(timerData);
        }
    });

    listeners.push({ type: 'timer', unsubscribe });
    return unsubscribe;
}

/**
 * Configure un listener pour les participants
 */
export function watchParticipants(callback) {
    if (!currentSessionRef) {
        throw new Error('Aucune session active');
    }

    const usersRef = ref(db, `sessions/${currentSessionId}/users`);
    const unsubscribe = onValue(usersRef, (snapshot) => {
        const users = snapshot.val() || {};
        callback(users);
    });

    listeners.push({ type: 'participants', unsubscribe });
    return unsubscribe;
}

/**
 * Retourne la phase actuelle de la session
 */
export function getCurrentPhase() {
    return currentPhase;
}

/**
 * Change la phase de la session (seulement pour l'OP)
 */
export async function setPhase(newPhase) {
    if (!isOwner) {
        throw new Error('Seul l\'organisateur peut changer la phase');
    }

    if (!currentSessionId) {
        throw new Error('Aucune session active');
    }

    const validPhases = ['reflexion', 'regroupement', 'vote', 'action'];
    if (!validPhases.includes(newPhase)) {
        throw new Error('Phase invalide');
    }

    const phaseRef = ref(db, `sessions/${currentSessionId}/phase`);

    try {
        await set(phaseRef, newPhase);
        currentPhase = newPhase;
    } catch (error) {
        console.error('Erreur lors du changement de phase:', error);
        throw error;
    }
}

/**
 * Écoute les changements de phase
 */
export function watchPhase(callback) {
    if (!currentSessionId) {
        throw new Error('Aucune session active');
    }

    const phaseRef = ref(db, `sessions/${currentSessionId}/phase`);

    const unsubscribe = onValue(phaseRef, (snapshot) => {
        const phase = snapshot.val() || 'reflexion';
        currentPhase = phase;
        callback(phase);
    });

    listeners.push({ type: 'phase', unsubscribe });
    return unsubscribe;
}

/**
 * Nettoie tous les listeners
 */
export function cleanup() {
    listeners.forEach(({ unsubscribe }) => unsubscribe());
    listeners = [];
    currentSessionRef = null;
    currentSessionId = null;
    currentUserId = null;
    currentUserName = null;
    isOwner = false;
    currentPhase = 'reflexion';
    votesUsed = 0;
}
