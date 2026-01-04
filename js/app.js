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
            UI.showError('Erreur d\'initialisation Firebase: ' + error.message);
            showSetupModal();
            return;
        }

        appState.db = db;
        appState.initialized = true;

        // Initialiser les modules
        Session.initialize(db);
        Cards.initialize(db);
        Timer.initialize(document.getElementById('timerDisplay'));

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
window.initializeFirebase = function() {
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
        UI.showError(validation.error);
        return;
    }

    // Sauvegarder et initialiser
    Config.saveConfig(config);

    const { db, error } = Config.initializeFirebase(config);
    if (error) {
        UI.showError('Erreur d\'initialisation: ' + error.message);
        return;
    }

    appState.db = db;
    appState.initialized = true;

    Session.initialize(db);
    Cards.initialize(db);
    Timer.initialize(document.getElementById('timerDisplay'));

    UI.toggleElement(document.getElementById('setupModal'), false);
    UI.toggleElement(document.getElementById('mainApp'), true);

    setupEventListeners();

    // Afficher le lien de partage
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
        UI.showSuccess('Lien copié dans le presse-papier !');
    } else {
        UI.showError('Impossible de copier le lien');
    }
};

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

    // Configurer les listeners de cartes
    setupCardsListeners();
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
        const sessionId = await Session.createNewSession();
        setupCardsListeners();
        UI.updateSessionDisplay(sessionId);
        UI.showSuccess('Session créée : ' + sessionId);
    } catch (error) {
        UI.showError(error.message);
    }
};

/**
 * Gère la jonction à une session
 */
window.joinSession = handleJoinSession;
function handleJoinSession() {
    try {
        const sessionId = UI.getInputValue('sessionIdInput');
        if (!sessionId) {
            UI.showError('Veuillez entrer un ID de session');
            return;
        }

        Session.joinSession(sessionId);
        setupCardsListeners();
        UI.updateSessionDisplay(sessionId);
        UI.showSuccess('Session rejointe : ' + sessionId);
    } catch (error) {
        UI.showError(error.message);
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
        UI.showError(error.message);
    }
}

/**
 * Gère le vote d'une carte
 */
window.voteCard = handleVoteCard;
async function handleVoteCard(type, key, currentVotes) {
    try {
        await Cards.voteCard(type, key, currentVotes);
    } catch (error) {
        UI.showError(error.message);
    }
}

/**
 * Gère la suppression d'une carte
 */
window.deleteCard = handleDeleteCard;
async function handleDeleteCard(type, key) {
    try {
        await Cards.deleteCard(type, key);
    } catch (error) {
        UI.showError(error.message);
    }
}

/**
 * Copie l'ID de session
 */
window.copySessionId = async function() {
    const sessionId = Session.getCurrentSessionId();
    if (!sessionId) {
        UI.showError('Aucune session active');
        return;
    }

    const success = await UI.copyToClipboard(sessionId);
    if (success) {
        UI.showSuccess('ID de session copié !');
    } else {
        UI.showError('Impossible de copier l\'ID');
    }
};

/**
 * Efface toutes les données de la session
 */
window.clearAll = async function() {
    try {
        await Session.clearSession();
    } catch (error) {
        UI.showError(error.message);
    }
};

/**
 * Exporte les données
 */
window.exportData = function() {
    try {
        Session.exportSession((data) => {
            const filename = `retrospective-${data.sessionId}-${new Date().toISOString().split('T')[0]}.json`;
            UI.downloadJSON(data, filename);
        });
    } catch (error) {
        UI.showError(error.message);
    }
};

/**
 * Gestion du minuteur
 */
window.startTimer = function(minutes) {
    Timer.start(minutes);
};

window.pauseTimer = function() {
    Timer.pause();
};

window.resetTimer = function() {
    Timer.stop();
};

// Initialiser l'application au chargement
window.addEventListener('load', initializeApp);
