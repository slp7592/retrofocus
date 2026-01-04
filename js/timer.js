/**
 * Module de gestion du minuteur de rétrospective
 */

let timerInterval = null;
let timeRemaining = 0;
let displayElement = null;

/**
 * Initialise le module avec l'élément d'affichage
 */
export function initialize(element) {
    displayElement = element;
    updateDisplay();
}

/**
 * Démarre le minuteur avec un nombre de minutes
 */
export function start(minutes) {
    stop();
    timeRemaining = minutes * 60;
    updateDisplay();

    timerInterval = setInterval(() => {
        timeRemaining--;
        updateDisplay();

        if (timeRemaining <= 0) {
            stop();
            alert('⏰ Temps écoulé !');
        }
    }, 1000);

    return true;
}

/**
 * Met en pause le minuteur
 */
export function pause() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        return true;
    }
    return false;
}

/**
 * Arrête et réinitialise le minuteur
 */
export function stop() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timeRemaining = 0;
    updateDisplay('15:00');
    return true;
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
