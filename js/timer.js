/**
 * Module de gestion du minuteur de rétrospective synchronisé
 */

let timerInterval = null;
let timeRemaining = 0;
let displayElement = null;
let updateCallback = null;
let notificationCallback = null;

/**
 * Initialise le module avec l'élément d'affichage et callback de mise à jour
 */
export function initialize(element, onUpdate = null, onTimerEnd = null) {
    displayElement = element;
    updateCallback = onUpdate;
    notificationCallback = onTimerEnd;
    updateDisplay();
}

/**
 * Démarre le minuteur avec un nombre de minutes (OP uniquement)
 */
export function start(minutes) {
    stop();
    timeRemaining = minutes * 60;
    updateDisplay();

    // Notifier Firebase de l'état initial
    if (updateCallback) {
        updateCallback(timeRemaining, true);
    }

    timerInterval = setInterval(() => {
        timeRemaining--;
        updateDisplay();

        // Notifier Firebase toutes les secondes
        if (updateCallback) {
            updateCallback(timeRemaining, true);
        }

        if (timeRemaining <= 0) {
            stop();
            if (notificationCallback) {
                notificationCallback();
            }
        }
    }, 1000);

    return true;
}

/**
 * Met en pause le minuteur (OP uniquement)
 */
export function pause() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;

        // Notifier Firebase
        if (updateCallback) {
            updateCallback(timeRemaining, false);
        }
        return true;
    }
    return false;
}

/**
 * Arrête et réinitialise le minuteur (OP uniquement)
 */
export function stop() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timeRemaining = 0;
    updateDisplay('05:00');

    // Notifier Firebase
    if (updateCallback) {
        updateCallback(0, false);
    }
    return true;
}

/**
 * Synchronise le timer avec les données Firebase (pour les participants)
 */
export function syncFromFirebase(timerData) {
    // Arrêter l'intervalle local si on en a un
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    timeRemaining = timerData.timeRemaining || 0;

    // Si le timer est actif, synchroniser le décompte
    if (timerData.isRunning && timeRemaining > 0) {
        // Calculer le temps écoulé depuis la dernière mise à jour
        const elapsed = Math.floor((Date.now() - timerData.lastUpdate) / 1000);
        timeRemaining = Math.max(0, timeRemaining - elapsed);

        updateDisplay();

        // Démarrer le décompte local
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateDisplay();

            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                updateDisplay('00:00');
            }
        }, 1000);
    } else {
        updateDisplay();
    }
}

/**
 * Met à jour l'affichage du minuteur
 */
function updateDisplay(customText = null) {
    if (!displayElement) return;

    if (customText) {
        displayElement.textContent = customText;
        return;
    }

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    displayElement.textContent =
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Récupère le temps restant en secondes
 */
export function getTimeRemaining() {
    return timeRemaining;
}

/**
 * Vérifie si le minuteur est en cours
 */
export function isRunning() {
    return timerInterval !== null;
}
