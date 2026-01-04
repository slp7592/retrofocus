/**
 * Module utilitaire pour les fonctions UI
 */

/**
 * Échappe les caractères HTML pour éviter les failles XSS
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Copie du texte dans le presse-papier
 */
export async function copyToClipboard(text) {
    // Vérifier si l'API Clipboard est disponible
    if (!navigator.clipboard) {
        console.error('API Clipboard non disponible');
        return false;
    }

    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Erreur lors de la copie:', error);
        // En cas d'échec (permissions, contexte non-sécurisé, etc.)
        return false;
    }
}

/**
 * Affiche/masque un élément
 */
export function toggleElement(element, show) {
    if (!element) return;
    element.style.display = show ? 'block' : 'none';
}

/**
 * Affiche un message d'erreur
 */
export function showError(message) {
    alert('❌ ' + message);
}

/**
 * Affiche un message de succès
 */
export function showSuccess(message) {
    alert('✅ ' + message);
}

/**
 * Rend les cartes dans un conteneur
 */
export function renderCards(container, cards, type, handlers) {
    if (!container) return;

    container.innerHTML = cards.map(card => `
        <div class="card">
            <div class="card-content">${escapeHtml(card.content)}</div>
            <div class="card-footer">
                <span class="card-author">${escapeHtml(card.author)}</span>
                <div class="card-actions">
                    <div class="votes">👍 ${card.votes || 0}</div>
                    <button class="card-btn" data-action="vote" data-type="${type}" data-key="${card.key}" data-votes="${card.votes || 0}">⬆️</button>
                    <button class="card-btn" data-action="delete" data-type="${type}" data-key="${card.key}">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');

    // Attacher les événements
    if (handlers) {
        container.querySelectorAll('[data-action="vote"]').forEach(btn => {
            btn.addEventListener('click', () => {
                handlers.onVote(
                    btn.dataset.type,
                    btn.dataset.key,
                    parseInt(btn.dataset.votes)
                );
            });
        });

        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                handlers.onDelete(btn.dataset.type, btn.dataset.key);
            });
        });
    }
}

/**
 * Met à jour l'affichage de la session
 */
export function updateSessionDisplay(sessionId) {
    const currentSessionDiv = document.getElementById('currentSession');
    const sessionIdDisplay = document.getElementById('sessionIdDisplay');

    if (currentSessionDiv && sessionIdDisplay && sessionId) {
        currentSessionDiv.style.display = 'block';
        sessionIdDisplay.textContent = sessionId;
    }
}

/**
 * Efface le contenu d'un input
 */
export function clearInput(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.value = '';
    }
}

/**
 * Récupère la valeur d'un input
 */
export function getInputValue(inputId) {
    const input = document.getElementById(inputId);
    return input ? input.value.trim() : '';
}

/**
 * Définit la valeur d'un input
 */
export function setInputValue(inputId, value) {
    const input = document.getElementById(inputId);
    if (input) {
        input.value = value;
    }
}

/**
 * Télécharge un fichier JSON
 */
export function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Capitalise la première lettre d'une chaîne
 */
export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
