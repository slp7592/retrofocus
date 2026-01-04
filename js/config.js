import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

/**
 * Module de gestion de la configuration Firebase
 * Gère le stockage local, le partage via URL et l'initialisation
 */

const STORAGE_KEY = 'firebaseConfig';

/**
 * Encode la configuration en base64 pour partage via URL
 */
export function encodeConfig(config) {
    const json = JSON.stringify(config);
    return btoa(encodeURIComponent(json));
}

/**
 * Décode une configuration depuis une chaîne base64
 */
export function decodeConfig(encoded) {
    try {
        const json = decodeURIComponent(atob(encoded));
        return JSON.parse(json);
    } catch (e) {
        console.error('Erreur de décodage de la configuration:', e);
        return null;
    }
}

/**
 * Récupère la configuration depuis l'URL (?config=...)
 */
export function getConfigFromURL() {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('config');
    if (encoded) {
        return decodeConfig(encoded);
    }
    return null;
}

/**
 * Sauvegarde la configuration dans le localStorage
 */
export function saveConfig(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Récupère la configuration depuis le localStorage
 */
export function loadConfig() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Erreur de lecture de la configuration:', e);
            return null;
        }
    }
    return null;
}

/**
 * Génère un lien de partage avec la configuration encodée
 */
export function generateShareLink(config) {
    const encoded = encodeConfig(config);
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?config=${encoded}`;
}

/**
 * Initialise Firebase avec la configuration fournie
 */
export function initializeFirebase(config) {
    try {
        const app = initializeApp(config);
        const db = getDatabase(app);
        return { app, db, error: null };
    } catch (error) {
        console.error('Erreur d\'initialisation Firebase:', error);
        return { app: null, db: null, error };
    }
}

/**
 * Valide la configuration Firebase
 */
export function validateConfig(config) {
    const requiredFields = ['apiKey', 'authDomain', 'databaseURL', 'projectId'];
    const missing = requiredFields.filter(field => !config[field]);

    if (missing.length > 0) {
        return {
            valid: false,
            error: `Champs obligatoires manquants: ${missing.join(', ')}`
        };
    }

    return { valid: true, error: null };
}

/**
 * Récupère la configuration depuis plusieurs sources (URL > localStorage)
 * et la sauvegarde si elle vient de l'URL
 */
export function getConfig() {
    // Priorité 1 : Configuration dans l'URL
    const urlConfig = getConfigFromURL();
    if (urlConfig) {
        const validation = validateConfig(urlConfig);
        if (validation.valid) {
            saveConfig(urlConfig);
            // Nettoyer l'URL pour éviter d'exposer la config
            window.history.replaceState({}, document.title, window.location.pathname);
            return urlConfig;
        }
    }

    // Priorité 2 : Configuration dans le localStorage
    return loadConfig();
}
