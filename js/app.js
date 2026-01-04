/**
 * Point d'entrée principal de l'application
 */

import * as Config from './config.js';
import * as Session from './session.js';
import * as Cards from './cards.js';
import * as Timer from './timer.js';
import * as UI from './ui.js';

// État global de l'application
let appState = {
    db: null,
    initialized: false
};

/**
 * Initialise Firebase et l'application
 */
async function initializeApp() {
    // Récupérer la configuration (URL ou localStorage)
    const config = Config.getConfig();

    if (config) {
        // Configuration trouvée, initialiser Firebase
        const { db, error } = Config.initializeFirebase(config);

        if (error) {
            await UI.showError('Erreur d\'initialisation Firebase: ' + error.message);
            showSetupModal();
            return;
        }

        appState.db = db;
        appState.initialized = true;

        // Initialiser les modules
        Session.initialize(db);
        Cards.initialize(db);
        Timer.initialize(document.getElementById('timerDisplay'), handleTimerUpdate, handleTimerEnd);

        // Afficher l'interface principale
        UI.toggleElement(document.getElementById('setupModal'), false);
        UI.toggleElement(document.getElementById('mainApp'), true);

        setupEventListeners();
    } else {
        // Pas de configuration, afficher le modal
        showSetupModal();
    }
}

/**
 * Affiche le modal de configuration
 */
function showSetupModal() {
    UI.toggleElement(document.getElementById('setupModal'), true);
    UI.toggleElement(document.getElementById('mainApp'), false);

    // Pré-remplir avec la config sauvegardée si disponible
    const savedConfig = Config.loadConfig();
    if (savedConfig) {
        UI.setInputValue('apiKey', savedConfig.apiKey || '');
        UI.setInputValue('authDomain', savedConfig.authDomain || '');
        UI.setInputValue('databaseURL', savedConfig.databaseURL || '');
        UI.setInputValue('projectId', savedConfig.projectId || '');
        UI.setInputValue('storageBucket', savedConfig.storageBucket || '');
        UI.setInputValue('messagingSenderId', savedConfig.messagingSenderId || '');
        UI.setInputValue('appId', savedConfig.appId || '');
    }
}

/**
 * Gère l'initialisation Firebase depuis le formulaire
 */
window.initializeFirebase = async function() {
    const config = {
        apiKey: UI.getInputValue('apiKey'),
        authDomain: UI.getInputValue('authDomain'),
        databaseURL: UI.getInputValue('databaseURL'),
        projectId: UI.getInputValue('projectId'),
        storageBucket: UI.getInputValue('storageBucket'),
        messagingSenderId: UI.getInputValue('messagingSenderId'),
        appId: UI.getInputValue('appId')
    };

    // Valider la configuration
    const validation = Config.validateConfig(config);
    if (!validation.valid) {
        await UI.showError(validation.error);
        return;
    }

    // Sauvegarder et initialiser
    Config.saveConfig(config);

    const { db, error } = Config.initializeFirebase(config);
    if (error) {
        await UI.showError('Erreur d\'initialisation: ' + error.message);
        return;
    }

    appState.db = db;
    appState.initialized = true;

    Session.initialize(db);
    Cards.initialize(db);
    Timer.initialize(document.getElementById('timerDisplay'), handleTimerUpdate, handleTimerEnd);

    // Afficher le lien de partage dans le modal
    showShareLink(config);
};

/**
 * Affiche le lien de partage de configuration
 */
function showShareLink(config) {
    const shareLink = Config.generateShareLink(config);
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success';
    alertDiv.innerHTML = `
        <strong>✅ Firebase configuré avec succès!</strong>
        <p style="margin-top: 10px; margin-bottom: 5px;">Partagez ce lien avec votre équipe pour qu'ils n'aient pas à reconfigurer Firebase :</p>
        <div class="share-link" onclick="copyShareLink(this)" title="Cliquer pour copier">
            ${shareLink}
        </div>
        <p style="margin-top: 5px; font-size: 12px; color: #2d5016;">📋 Cliquez sur le lien pour le copier</p>
        <button class="btn btn-primary" onclick="closeConfigAndStart()" style="width: 100%; margin-top: 15px;">
            Continuer vers l'application →
        </button>
    `;

    const setupContent = document.querySelector('.setup-content');
    const existingAlert = setupContent.querySelector('.alert-success');
    if (existingAlert) {
        existingAlert.remove();
    }

    setupContent.insertBefore(alertDiv, setupContent.firstChild);
}

/**
 * Copie le lien de partage
 */
window.copyShareLink = async function(element) {
    const link = element.textContent.trim();
    const success = await UI.copyToClipboard(link);
    if (success) {
        await UI.showSuccess('Lien copié dans le presse-papier !');
    } else {
        await UI.showError('Impossible de copier le lien');
    }
};

/**
 * Ferme le modal de configuration et démarre l'application
 */
window.closeConfigAndStart = function() {
    UI.toggleElement(document.getElementById('setupModal'), false);
    UI.toggleElement(document.getElementById('mainApp'), true);
    setupEventListeners();
};

/**
 * Verrouille l'input du nom d'utilisateur après jonction/création de session
 */
function lockUserNameInput() {
    const userNameInput = document.getElementById('userName');
    if (userNameInput) {
        userNameInput.disabled = true;
        userNameInput.style.backgroundColor = '#e2e8f0';
        userNameInput.style.cursor = 'not-allowed';
    }
}

/**
 * Configure les écouteurs d'événements
 */
function setupEventListeners() {
    // Gestion des entrées avec la touche Entrée
    ['Positive', 'Negative', 'Action'].forEach(type => {
        const input = document.getElementById(`input${type}`);
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleAddCard(type.toLowerCase());
                }
            });
        }
    });

    // Session input
    const sessionInput = document.getElementById('sessionIdInput');
    if (sessionInput) {
        sessionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleJoinSession();
            }
        });
    }

    // Ne pas configurer les listeners de cartes ici
    // Ils seront configurés uniquement lors de la création/jonction d'une session
}

/**
 * Configure les listeners pour les cartes
 */
function setupCardsListeners() {
    ['positive', 'negative', 'action'].forEach(type => {
        Cards.watchCards(type, (cards) => {
            const containerId = `cards${UI.capitalize(type)}`;
            const container = document.getElementById(containerId);

            UI.renderCards(container, cards, type, {
                onVote: handleVoteCard,
                onDelete: handleDeleteCard
            });
        });
    });
}

/**
 * Gère la création d'une nouvelle session
 */
window.createNewSession = async function() {
    try {
        const userName = UI.getInputValue('userName');
        if (!userName) {
            await UI.showError('Veuillez entrer un nom d\'utilisateur');
            return;
        }

        const sessionId = await Session.createNewSession(userName);
        lockUserNameInput();
        setupCardsListeners();
        setupTimerListener();
        setupParticipantsListener();
        updateUIPermissions();
        updateSessionUI(sessionId);
        await UI.showSuccess('Session créée : ' + sessionId);
    } catch (error) {
        await UI.showError(error.message);
    }
};

/**
 * Gère la jonction à une session
 */
window.joinSession = handleJoinSession;
async function handleJoinSession() {
    try {
        const sessionId = UI.getInputValue('sessionIdInput');
        if (!sessionId) {
            await UI.showError('Veuillez entrer un ID de session');
            return;
        }

        const userName = UI.getInputValue('userName');
        if (!userName) {
            await UI.showError('Veuillez entrer un nom d\'utilisateur');
            return;
        }

        await Session.joinSession(sessionId, userName);
        lockUserNameInput();
        setupCardsListeners();
        setupTimerListener();
        setupParticipantsListener();
        updateUIPermissions();
        updateSessionUI(sessionId);
        await UI.showSuccess('Session rejointe : ' + sessionId);
    } catch (error) {
        await UI.showError(error.message);
    }
}

/**
 * Gère l'ajout d'une carte
 */
window.addCard = handleAddCard;
async function handleAddCard(type) {
    try {
        const inputId = `input${UI.capitalize(type)}`;
        const content = UI.getInputValue(inputId);

        if (!content) return;

        await Cards.addCard(type, content);
        UI.clearInput(inputId);
    } catch (error) {
        await UI.showError(error.message);
    }
}

/**
 * Gère le vote d'une carte
 */
window.voteCard = handleVoteCard;
async function handleVoteCard(type, key, currentVotes) {
    try {
        await Cards.voteCard(type, key, currentVotes);
        updateVoteDisplay();
    } catch (error) {
        await UI.showError(error.message);
    }
}

/**
 * Gère la suppression d'une carte
 */
window.deleteCard = handleDeleteCard;
async function handleDeleteCard(type, key, cardAuthor) {
    try {
        await Cards.deleteCard(type, key, cardAuthor, UI.showConfirm);
    } catch (error) {
        await UI.showError(error.message);
    }
}

/**
 * Copie l'ID de session
 */
window.copySessionId = async function() {
    const sessionId = Session.getCurrentSessionId();
    if (!sessionId) {
        await UI.showError('Aucune session active');
        return;
    }

    const success = await UI.copyToClipboard(sessionId);
    if (success) {
        await UI.showSuccess('ID de session copié !');
    } else {
        await UI.showError('Impossible de copier l\'ID');
    }
};

/**
 * Efface toutes les données de la session
 */
window.clearAll = async function() {
    try {
        await Session.clearSession(UI.showConfirm);
    } catch (error) {
        await UI.showError(error.message);
    }
};

/**
 * Exporte les données
 */
window.exportData = async function() {
    try {
        Session.exportSession((data) => {
            const filename = `retrospective-${data.sessionId}-${new Date().toISOString().split('T')[0]}.json`;
            UI.downloadJSON(data, filename);
        });
    } catch (error) {
        await UI.showError(error.message);
    }
};

/**
 * Met à jour l'UI selon les permissions de l'utilisateur
 */
function updateUIPermissions() {
    const isOwner = Session.isSessionOwner();

    // Boutons et éléments réservés à l'OP
    const ownerElements = [
        document.getElementById('clearAllBtn'),
        document.querySelector('.export-section'),
        document.querySelector('.timer-controls')
    ];

    ownerElements.forEach(el => {
        if (el) {
            el.style.display = isOwner ? '' : 'none';
        }
    });

    // Input et bouton pour les actions
    const actionInput = document.getElementById('inputAction');
    const actionAddBtn = actionInput?.nextElementSibling;

    if (actionInput && actionAddBtn) {
        actionInput.disabled = !isOwner;
        actionInput.placeholder = isOwner
            ? 'Quelle action mettre en place ?'
            : 'Seul l\'organisateur peut ajouter des actions';
        actionAddBtn.style.display = isOwner ? '' : 'none';
    }
}

/**
 * Met à jour l'affichage des votes restants
 */
function updateVoteDisplay() {
    const votesRemainingDiv = document.getElementById('votesRemaining');
    const votesCountSpan = document.getElementById('votesCount');

    if (votesRemainingDiv && votesCountSpan) {
        votesRemainingDiv.style.display = 'block';
        votesCountSpan.textContent = Session.getVotesRemaining();
    }
}

/**
 * Met à jour l'UI après avoir rejoint/créé une session
 */
function updateSessionUI(sessionId) {
    // Masquer la section de session
    const sessionSection = document.querySelector('.session-section');
    if (sessionSection) {
        sessionSection.style.display = 'none';
    }

    // Afficher l'ID de session dans le header
    const headerSessionId = document.getElementById('headerSessionId');
    const headerSessionIdText = document.getElementById('headerSessionIdText');

    if (headerSessionId && headerSessionIdText) {
        headerSessionId.style.display = 'block';
        headerSessionIdText.textContent = sessionId;
    }

    // Afficher la section currentSession (contient participants et autres infos)
    const currentSession = document.getElementById('currentSession');
    if (currentSession) {
        currentSession.style.display = 'block';
    }

    // Afficher le compteur de votes
    updateVoteDisplay();
}

/**
 * Configure le listener pour synchroniser le timer
 */
function setupTimerListener() {
    Session.watchTimer((timerData) => {
        // Si on n'est pas l'OP, synchroniser avec Firebase
        if (!Session.isSessionOwner()) {
            Timer.syncFromFirebase(timerData);
        }
    });
}

/**
 * Configure le listener pour afficher les participants
 */
function setupParticipantsListener() {
    Session.watchParticipants((users) => {
        updateParticipantsList(users);
    });
}

/**
 * Met à jour l'affichage de la liste des participants
 */
function updateParticipantsList(users) {
    const participantsList = document.getElementById('participantsList');
    const participantsCount = document.getElementById('participantsCount');
    const participantsNames = document.getElementById('participantsNames');

    if (!participantsList || !participantsCount || !participantsNames) return;

    const userEntries = Object.entries(users);
    const count = userEntries.length;

    participantsCount.textContent = count;

    if (count > 0) {
        participantsList.style.display = 'block';

        const currentUserId = Session.getCurrentUserId();

        participantsNames.innerHTML = userEntries
            .map(([userId, userName]) => {
                let badgeClass = 'participant-badge';
                let displayName = UI.escapeHtml(userName);

                // Marquer l'utilisateur actuel
                if (userId === currentUserId) {
                    badgeClass += ' current-user';
                    displayName += ' (vous)';
                }

                // Marquer l'organisateur
                if (Session.isSessionOwner() && userId === currentUserId) {
                    displayName = displayName.replace(' (vous)', ' (OP)');
                }

                return `<span class="${badgeClass}">${displayName}</span>`;
            })
            .join('');
    } else {
        participantsList.style.display = 'none';
    }
}

/**
 * Callback pour mettre à jour le timer dans Firebase (OP uniquement)
 */
function handleTimerUpdate(timeRemaining, isRunning) {
    if (Session.isSessionOwner()) {
        Session.updateTimerState(timeRemaining, isRunning).catch(error => {
            console.error('Erreur de mise à jour du timer:', error);
        });
    }
}

/**
 * Callback pour la fin du timer
 */
async function handleTimerEnd() {
    await UI.showSuccess('⏰ Temps écoulé !');
}

/**
 * Gestion du minuteur (OP uniquement)
 */
window.startTimer = async function(minutes) {
    if (!Session.isSessionOwner()) {
        await UI.showError('Seul l\'organisateur peut contrôler le timer');
        return;
    }
    Timer.start(minutes);
};

window.pauseTimer = async function() {
    if (!Session.isSessionOwner()) {
        await UI.showError('Seul l\'organisateur peut contrôler le timer');
        return;
    }
    Timer.pause();
};

window.resetTimer = async function() {
    if (!Session.isSessionOwner()) {
        await UI.showError('Seul l\'organisateur peut contrôler le timer');
        return;
    }
    Timer.stop();
};

// Initialiser l'application au chargement
window.addEventListener('load', initializeApp);
