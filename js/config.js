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
 * Sanitize la configuration pour supprimer les caractères dangereux
 */
export function sanitizeConfig(config) {
    const sanitized = {};

    for (const [key, value] of Object.entries(config)) {
        if (typeof value === 'string') {
            // Supprimer les caractères potentiellement dangereux
            sanitized[key] = value
                .replace(/[<>"'`]/g, '') // Supprimer caractères HTML/JS
                .trim();
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Valide la configuration Firebase avec validation stricte des formats
 */
export function validateConfig(config) {
    const requiredFields = ['apiKey', 'authDomain', 'databaseURL', 'projectId'];

    // 1. Vérifier les champs manquants
    const missing = requiredFields.filter(field => !config[field]);
    if (missing.length > 0) {
        return {
            valid: false,
            error: `Champs obligatoires manquants: ${missing.join(', ')}`
        };
    }

    // 2. Validation des formats avec regex
    const validations = {
        apiKey: {
            regex: /^AIza[0-9A-Za-z_-]{35}$/,
            error: 'API Key invalide (format attendu: AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX)'
        },
        authDomain: {
            regex: /^[a-z0-9-]+\.firebaseapp\.com$/,
            error: 'Auth Domain invalide (format attendu: projet-id.firebaseapp.com)'
        },
        databaseURL: {
            regex: /^https:\/\/[a-z0-9-]+-default-rtdb\.[a-z0-9-]+\.firebasedatabase\.app$/,
            error: 'Database URL invalide (doit commencer par https://)'
        },
        projectId: {
            regex: /^[a-z0-9-]+$/,
            error: 'Project ID invalide (lettres minuscules, chiffres et tirets uniquement)'
        }
    };

    // Validation optionnelle si présents
    const optionalValidations = {
        storageBucket: {
            // Accepter : vide, *.appspot.com, ou *.firebasestorage.app
            regex: /^$|^[a-z0-9-]+\.(appspot\.com|firebasestorage\.app)$/,
            error: 'Storage Bucket invalide (format attendu: projet-id.appspot.com ou projet-id.firebasestorage.app)'
        },
        messagingSenderId: {
            regex: /^[0-9]{12}$/,
            error: 'Messaging Sender ID invalide (12 chiffres attendus)'
        },
        appId: {
            regex: /^1:[0-9]{12}:web:[a-z0-9]+$/,
            error: 'App ID invalide'
        }
    };

    // Valider les champs requis
    for (const [field, validation] of Object.entries(validations)) {
        if (!validation.regex.test(config[field])) {
            return { valid: false, error: validation.error };
        }
    }

    // Valider les champs optionnels s'ils sont présents
    for (const [field, validation] of Object.entries(optionalValidations)) {
        if (config[field] && !validation.regex.test(config[field])) {
            return { valid: false, error: validation.error };
        }
    }

    // 3. Validation supplémentaire : longueur maximale
    const maxLengths = {
        apiKey: 50,
        authDomain: 100,
        databaseURL: 200,
        projectId: 50
    };

    for (const [field, maxLength] of Object.entries(maxLengths)) {
        if (config[field] && config[field].length > maxLength) {
            return {
                valid: false,
                error: `${field} trop long (max ${maxLength} caractères)`
            };
        }
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
        const sanitized = sanitizeConfig(urlConfig);
        const validation = validateConfig(sanitized);
        if (validation.valid) {
            saveConfig(sanitized);
            // Nettoyer l'URL pour éviter d'exposer la config
            window.history.replaceState({}, document.title, window.location.pathname);
            return sanitized;
        } else {
            console.error('Configuration invalide depuis URL:', validation.error);
        }
    }

    // Priorité 2 : Configuration dans le localStorage
    return loadConfig();
}
