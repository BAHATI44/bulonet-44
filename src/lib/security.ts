// ======================================================
// Fichier     : src/lib/security.ts
// Projet      : Bulonet 🚀
// Description : Utilitaires de sécurité – validation,
//               nettoyage, protection contre les attaques
//               (XSS, injection, clickjacking, devtools),
//               gestion de CSP, rate limiting client.
// ======================================================

// ====================================================
// 1. NETTOYAGE ET VALIDATION DES ENTRÉES
// ====================================================

/**
 * 🧹 Nettoie une chaîne de caractères pour éliminer les risques XSS.
 * Supprime les balises, protocoles dangereux et espaces superflus.
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Supprime < et >
    .replace(/javascript:/gi, '') // Supprime javascript:
    .replace(/on\w+\s*=/gi, '') // Supprime les gestionnaires d'événements (onclick=...)
    .replace(/data:\s*text\/html/gi, '') // Supprime data:text/html
    .trim();
};

/**
 * 🔗 Nettoie une URL – n'autorise que http et https.
 * Retourne l'URL nettoyée ou null si invalide.
 */
export const sanitizeUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

/**
 * 📧 Valide le format d'un email (et la longueur).
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 255;
};

/**
 * 🕵️ Détecte les tentatives d'injection SQL ou script.
 */
export const detectInjection = (input: string): boolean => {
  const patterns = [
    /(<script[\s>])/i,
    /(union\s+select)/i,
    /(drop\s+table)/i,
    /(insert\s+into)/i,
    /(delete\s+from)/i,
    /(--\s*$)/,
    /(\/\*.*\*\/)/,
    /(\b(eval|exec|execute)\s*\()/i,
  ];
  return patterns.some((p) => p.test(input));
};

// ====================================================
// 2. PROTECTION CONTRE LE VOL DE DONNÉES / CLONAGE
// ====================================================

/**
 * 🚫 Empêche le clic droit (protection contre le copier-coller rapide).
 * À activer uniquement sur les pages sensibles.
 */
export const disableContextMenu = () => {
  document.addEventListener('contextmenu', (e) => e.preventDefault());
};

/**
 * 🚫 Empêche la sélection de texte (anti-copy).
 */
export const disableTextSelection = () => {
  document.addEventListener('selectstart', (e) => e.preventDefault());
};

/**
 * ⌨️ Bloque les raccourcis clavier dangereux (devtools, view source, etc.).
 */
export const disableDevShortcuts = () => {
  document.addEventListener('keydown', (e) => {
    // Empêche Ctrl+U (view source), Ctrl+S (save), Ctrl+Shift+I/J/C (devtools), F12
    if (
      (e.ctrlKey && e.key === 'u') ||
      (e.ctrlKey && e.key === 's') ||
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.shiftKey && e.key === 'J') ||
      (e.ctrlKey && e.shiftKey && e.key === 'C') ||
      e.key === 'F12'
    ) {
      e.preventDefault();
    }
  });
};

// ====================================================
// 3. ANTI-CLICKJACKING / PROTECTION IFRAME
// ====================================================

/**
 * 🔒 Empêche l'affichage du site dans une iframe (sauf exceptions).
 * Permet les previews lovable.app et localhost en développement.
 */
export const preventFraming = () => {
  if (window.top !== window.self) {
    // Autorise les previews lovable et localhost (pour le dev)
    try {
      const referrer = document.referrer || '';
      if (!referrer.includes('lovable.app') && !referrer.includes('localhost')) {
        window.top!.location.href = window.self.location.href; // Redirige la page parent
      }
    } catch {
      // Cross-origin – impossible d'accéder à top, donc on est dans une iframe externe
      // On peut afficher un message ou rediriger (mais on ne peut pas modifier top)
    }
  }
};

// ====================================================
// 4. DÉTECTION DES OUTILS DE DÉVELOPPEMENT
// ====================================================

/**
 * 🕵️ Détecte si les DevTools sont ouverts (via la différence de performance).
 * @param callback Fonction appelée avec un booléen (true = ouvert)
 */
export const detectDevTools = (callback: (isOpen: boolean) => void): void => {
  const threshold = 100; // ms
  const check = () => {
    const start = performance.now();
    debugger; // Provoque un ralentissement si DevTools ouverts
    const end = performance.now();
    if (end - start > threshold) {
      callback(true);
    } else {
      callback(false);
    }
  };
  // Vérification périodique
  check();
  setInterval(check, 2000);
};

// ====================================================
// 5. RATE LIMITING CÔTÉ CLIENT (pour éviter les abus)
// ====================================================

export class RateLimiter {
  private attempts: Map<string, { count: number; resetAt: number }> = new Map();

  /**
   * @param maxAttempts Nombre maximum de tentatives autorisées
   * @param windowMs Fenêtre de temps en millisecondes
   */
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60_000
  ) {}

  /**
   * Vérifie si une action est autorisée pour une clé donnée.
   * @returns Objet avec allowed (booléen), remainingAttempts, retryAfterMs
   */
  check(key: string): { allowed: boolean; remainingAttempts: number; retryAfterMs: number } {
    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry || now > entry.resetAt) {
      this.attempts.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remainingAttempts: this.maxAttempts - 1, retryAfterMs: 0 };
    }

    if (entry.count >= this.maxAttempts) {
      return { allowed: false, remainingAttempts: 0, retryAfterMs: entry.resetAt - now };
    }

    entry.count++;
    return { allowed: true, remainingAttempts: this.maxAttempts - entry.count, retryAfterMs: 0 };
  }

  /** Réinitialise le compteur pour une clé */
  reset(key: string) {
    this.attempts.delete(key);
  }
}

// ====================================================
// 6. GÉNÉRATION DE NONCE POUR CSP
// ====================================================

/**
 * 🔑 Génère un nonce aléatoire à utiliser dans les politiques CSP.
 */
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
};

// ====================================================
// 7. FONCTIONS DE HAUT NIVEAU (APPLICATION GLOBALE)
// ====================================================

/**
 * 🛡️ Active toutes les protections de base (à appeler dans main.tsx en production).
 */
export const enableSecurity = () => {
  if (import.meta.env.PROD) {
    preventFraming();
    disableContextMenu();
    disableTextSelection();
    disableDevShortcuts();
    detectDevTools((isOpen) => {
      if (isOpen) {
        console.warn('⚠️ DevTools détecté – soyez vigilant avec les données sensibles.');
        // Optionnel : envoyer un événement au serveur
      }
    });
  }
};

// ====================================================
// 8. UTILITAIRES DIVERS
// ====================================================

/**
 * 🧪 Valide une chaîne de caractères selon des règles strictes (sans chiffres, etc.)
 * Peut être utilisé pour les noms, etc.
 */
export const isValidName = (name: string): boolean => {
  return /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/.test(name.trim());
};

/**
 * 📞 Valide un numéro de téléphone (format international simple).
 */
export const isValidPhone = (phone: string): boolean => {
  return /^\+?[0-9]{8,15}$/.test(phone.replace(/[\s\-]/g, ''));
};

// ====================================================
// 💡 CONSEILS & ORIENTATIONS
// ====================================================
// - Ce fichier doit être importé dans `main.tsx` et/ou utilisé dans les composants.
// - Les fonctions de désactivation (contextmenu, selectstart) peuvent gêner l'expérience utilisateur.
//   Activez-les uniquement sur les pages sensibles (paiement, admin).
// - La détection DevTools n'est pas fiable à 100%, mais ajoute une couche de dissuasion.
// - Pour une protection plus avancée, utilisez les en-têtes HTTP (CSP, X-Frame-Options) côté serveur.
// - Le rate limiter est côté client ; il ne remplace pas une limitation serveur.
// ====================================================};

// Anti-iframe: prevent site from being embedded in iframes
export const preventFraming = () => {
  if (window.top !== window.self) {
    // Allow lovable preview frames
    try {
      if (!document.referrer.includes('lovable.app') && !document.referrer.includes('localhost')) {
        window.top!.location.href = window.self.location.href;
      }
    } catch {
      // Cross-origin - can't access top, which means we're framed by external site
    }
  }
};
