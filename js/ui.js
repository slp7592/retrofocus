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
 * Rend les cartes dans un conteneur (avec support des groupes)
 */
export function renderCards(container, items, type, handlers) {
    if (!container) return;

    // Les actions n'ont pas de système de vote
    const hasVotingSystem = type !== 'action';

    // Afficher le bouton de vote uniquement si on peut voter
    const canVote = hasVotingSystem && (!handlers.canVote || handlers.canVote());

    // Déterminer si on est en phase de regroupement
    const isGroupingPhase = handlers.isGroupingPhase ? handlers.isGroupingPhase() : false;
    const canGroup = handlers.canGroup ? handlers.canGroup() : false;

    // Détecter les cartes/groupes qui ont changé de position
    const previousOrder = previousCardsOrder[type] || [];
    const movedItems = new Set();

    items.forEach((item, newIndex) => {
        const itemId = item.isGroup ? item.groupId : item.key;
        const oldIndex = previousOrder.indexOf(itemId);
        if (oldIndex !== -1 && oldIndex !== newIndex) {
            movedItems.add(itemId);
        }
    });

    // Stocker le nouvel ordre
    previousCardsOrder[type] = items.map(item => item.isGroup ? item.groupId : item.key);

    container.innerHTML = items.map(item => {
        if (item.isGroup) {
            // Rendu d'un groupe de cartes
            const firstCard = item.cards[0];
            const itemId = item.groupId;
            const cardClass = movedItems.has(itemId) ? 'card card-group card-moved' : 'card card-group';

            return `
            <div class="${cardClass}"
                 data-card-key="${firstCard.key}"
                 data-group-id="${item.groupId}"
                 data-is-group="true"
                 ${canGroup ? 'draggable="false"' : ''}>
                <div class="card-group-badge" data-action="show-group-detail" data-type="${type}" data-group-id="${item.groupId}">
                    📦 ${item.cards.length}
                </div>
                ${isGroupingPhase && canGroup ? `
                    <button class="card-ungroup-all-btn" data-action="ungroup-all" data-type="${type}" data-group-id="${item.groupId}" title="Dégrouper tout">📤</button>
                ` : ''}
                <div class="card-content">${escapeHtml(firstCard.content)}</div>
                <div class="card-footer">
                    <span class="card-author">${escapeHtml(firstCard.author)} +${item.cards.length - 1}</span>
                    <div class="card-actions">
                        ${hasVotingSystem ? `
                            <div class="votes">👍 ${firstCard.votes || 0}</div>
                            ${canVote ? `<button class="card-btn" data-action="vote" data-type="${type}" data-key="${firstCard.key}" data-votes="${firstCard.votes || 0}">⬆️</button>` : ''}
                        ` : ''}
                        <span class="card-btn-placeholder"></span>
                    </div>
                </div>
            </div>
            `;
        } else {
            // Rendu d'une carte individuelle
            const canDelete = handlers.canDelete ? handlers.canDelete(item, type) : true;
            const itemId = item.key;
            const cardClass = movedItems.has(itemId) ? 'card card-moved' : 'card';
            const dragAttr = canGroup && !item.groupId ? 'draggable="true"' : '';
            const dropZoneAttr = canGroup ? 'data-drop-zone="true"' : '';

            return `
            <div class="${cardClass}"
                 data-card-key="${item.key}"
                 data-is-group="false"
                 ${dragAttr}
                 ${dropZoneAttr}>
                ${item.groupId && isGroupingPhase && canGroup ? `
                    <button class="card-ungroup-btn" data-action="ungroup" data-type="${type}" data-key="${item.key}" title="Retirer du groupe">↩️</button>
                ` : ''}
                <div class="card-content">${escapeHtml(item.content)}</div>
                <div class="card-footer">
                    <span class="card-author">${escapeHtml(item.author)}</span>
                    <div class="card-actions">
                        ${hasVotingSystem ? `
                            <div class="votes">👍 ${item.votes || 0}</div>
                            ${canVote ? `<button class="card-btn" data-action="vote" data-type="${type}" data-key="${item.key}" data-votes="${item.votes || 0}">⬆️</button>` : ''}
                        ` : ''}
                        ${canDelete
                            ? `<button class="card-btn" data-action="delete" data-type="${type}" data-key="${item.key}" data-author="${escapeHtml(item.author)}">🗑️</button>`
                            : `<span class="card-btn-placeholder"></span>`
                        }
                    </div>
                </div>
            </div>
            `;
        }
    }).join('');

    // Retirer la classe d'animation après son exécution
    setTimeout(() => {
        container.querySelectorAll('.card-moved').forEach(card => {
            card.classList.remove('card-moved');
        });
    }, 600);

    // Attacher les événements
    if (handlers) {
        if (canVote) {
            container.querySelectorAll('[data-action="vote"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const isGroup = btn.dataset.isGroup === 'true';
                    const groupId = btn.dataset.groupId || null;
                    handlers.onVote(
                        btn.dataset.type,
                        btn.dataset.key,
                        parseInt(btn.dataset.votes),
                        isGroup,
                        groupId
                    );
                });
            });
        }

        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                handlers.onDelete(btn.dataset.type, btn.dataset.key, btn.dataset.author);
            });
        });

        container.querySelectorAll('[data-action="ungroup"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (handlers.onUngroup) {
                    handlers.onUngroup(btn.dataset.type, btn.dataset.key);
                }
            });
        });

        container.querySelectorAll('[data-action="ungroup-all"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (handlers.onUngroupAll) {
                    handlers.onUngroupAll(btn.dataset.type, btn.dataset.groupId);
                }
            });
        });

        container.querySelectorAll('[data-action="show-group-detail"]').forEach(badge => {
            badge.addEventListener('click', () => {
                if (window.showGroupDetail) {
                    window.showGroupDetail(badge.dataset.type, badge.dataset.groupId);
                }
            });
        });

        // Configurer le drag & drop si en phase de regroupement
        if (canGroup) {
            setupDragAndDrop(container, type, handlers);
        }
    }
}

/**
 * Configure le système de drag & drop pour le regroupement
 */
function setupDragAndDrop(container, type, handlers) {
    let draggedElement = null;

    // Gérer le début du drag
    container.querySelectorAll('[draggable="true"]').forEach(card => {
        card.addEventListener('dragstart', (e) => {
            draggedElement = e.target;
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', e.target.innerHTML);
        });

        card.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
            // Retirer tous les highlights
            container.querySelectorAll('.drop-target').forEach(el => {
                el.classList.remove('drop-target');
            });
            draggedElement = null;
        });
    });

    // Gérer le drop sur les zones valides
    container.querySelectorAll('[data-drop-zone="true"]').forEach(dropZone => {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            // Highlight la zone de dépôt
            if (draggedElement && dropZone !== draggedElement) {
                dropZone.classList.add('drop-target');
            }
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drop-target');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();

            dropZone.classList.remove('drop-target');

            if (!draggedElement || dropZone === draggedElement) {
                return;
            }

            const draggedKey = draggedElement.dataset.cardKey;
            const targetKey = dropZone.dataset.cardKey;

            if (draggedKey && targetKey && handlers.onGroup) {
                handlers.onGroup(type, draggedKey, targetKey);
            }
        });
    });

    // Permettre le drop sur les groupes
    container.querySelectorAll('[data-is-group="true"]').forEach(group => {
        group.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            if (draggedElement) {
                group.classList.add('drop-target');
            }
        });

        group.addEventListener('dragleave', () => {
            group.classList.remove('drop-target');
        });

        group.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();

            group.classList.remove('drop-target');

            if (!draggedElement) {
                return;
            }

            const draggedKey = draggedElement.dataset.cardKey;
            const targetKey = group.dataset.cardKey;

            if (draggedKey && targetKey && handlers.onGroup) {
                handlers.onGroup(type, draggedKey, targetKey);
            }
        });
    });
}

/**
 * Affiche la modal de détail d'un groupe
 */
export function showGroupDetailModal(cards) {
    const modal = document.getElementById('groupDetailModal');
    const title = document.getElementById('groupDetailTitle');
    const content = document.getElementById('groupDetailContent');

    if (!modal || !title || !content) return;

    title.textContent = `Groupe de ${cards.length} cartes`;

    content.innerHTML = cards.map((card, index) => `
        <div class="group-detail-card">
            <div class="group-detail-number">#${index + 1}</div>
            <div class="group-detail-content">
                <div class="group-detail-text">${escapeHtml(card.content)}</div>
                <div class="group-detail-author">par ${escapeHtml(card.author)}</div>
            </div>
        </div>
    `).join('');

    modal.style.display = 'flex';
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
