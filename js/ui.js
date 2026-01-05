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
 * Affiche une popup personnalisée
 */
function showModal(icon, message, buttons) {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        const modalIcon = document.getElementById('modalIcon');
        const modalMessage = document.getElementById('modalMessage');
        const modalButtons = document.getElementById('modalButtons');

        modalIcon.textContent = icon;
        modalMessage.textContent = message;
        modalButtons.innerHTML = '';

        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.className = `modal-btn ${button.className || 'modal-btn-primary'}`;
            btn.textContent = button.text;
            btn.onclick = () => {
                modal.style.display = 'none';
                resolve(button.value);
            };
            modalButtons.appendChild(btn);
        });

        modal.style.display = 'flex';
    });
}

/**
 * Affiche un message d'erreur
 */
export function showError(message) {
    return showModal('❌', message, [
        { text: 'OK', value: true, className: 'modal-btn-danger' }
    ]);
}

/**
 * Affiche un message de succès
 */
export function showSuccess(message) {
    return showModal('✅', message, [
        { text: 'OK', value: true, className: 'modal-btn-primary' }
    ]);
}

/**
 * Affiche une popup de confirmation
 */
export function showConfirm(message) {
    return showModal('⚠️', message, [
        { text: 'Annuler', value: false, className: 'modal-btn-secondary' },
        { text: 'Confirmer', value: true, className: 'modal-btn-danger' }
    ]);
}

// Stockage de l'ordre précédent des cartes pour détecter les mouvements
const previousCardsOrder = {};

/**
 * Rend les cartes dans un conteneur
 */
export function renderCards(container, cards, type, handlers) {
    if (!container) return;

    // Les actions n'ont pas de système de vote
    const showVotes = type !== 'action';

    // Détecter les cartes qui ont changé de position
    const previousOrder = previousCardsOrder[type] || [];
    const movedCards = new Set();

    cards.forEach((card, newIndex) => {
        const oldIndex = previousOrder.indexOf(card.key);
        if (oldIndex !== -1 && oldIndex !== newIndex) {
            movedCards.add(card.key);
        }
    });

    // Stocker le nouvel ordre
    previousCardsOrder[type] = cards.map(c => c.key);

    container.innerHTML = cards.map(card => {
        // Déterminer si l'utilisateur peut supprimer cette carte
        const canDelete = handlers.canDelete ? handlers.canDelete(card, type) : true;

        // Ajouter la classe d'animation si la carte a bougé
        const cardClass = movedCards.has(card.key) ? 'card card-moved' : 'card';

        return `
        <div class="${cardClass}" data-card-key="${card.key}">
            <div class="card-content">${escapeHtml(card.content)}</div>
            <div class="card-footer">
                <span class="card-author">${escapeHtml(card.author)}</span>
                <div class="card-actions">
                    ${showVotes ? `
                        <div class="votes">👍 ${card.votes || 0}</div>
                        <button class="card-btn" data-action="vote" data-type="${type}" data-key="${card.key}" data-votes="${card.votes || 0}">⬆️</button>
                    ` : ''}
                    ${canDelete ? `<button class="card-btn" data-action="delete" data-type="${type}" data-key="${card.key}" data-author="${escapeHtml(card.author)}">🗑️</button>` : ''}
                </div>
            </div>
        </div>
    `;
    }).join('');

    // Retirer la classe d'animation après son exécution pour permettre de futures animations
    setTimeout(() => {
        container.querySelectorAll('.card-moved').forEach(card => {
            card.classList.remove('card-moved');
        });
    }, 600);

    // Attacher les événements
    if (handlers) {
        if (showVotes) {
            container.querySelectorAll('[data-action="vote"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    handlers.onVote(
                        btn.dataset.type,
                        btn.dataset.key,
                        parseInt(btn.dataset.votes)
                    );
                });
            });
        }

        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                handlers.onDelete(btn.dataset.type, btn.dataset.key, btn.dataset.author);
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
