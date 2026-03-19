// ======================================================
// Fichier : src/main.tsx
// Projet  : Bulonet 🚀
// Rôle    : Point d'entrée React – initialise l'app, la sécurité,
//           les analytics, et les erreurs globales.
// ======================================================

import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App.tsx';
import './index.css';

// 🔐 Fonctions de sécurité (protection basique)
import {
  preventFraming,
  disableContextMenu,
  disableDevShortcuts,
  detectDevTools, // 👈 Nouvelle fonction : détecte l'ouverture des dev tools
} from './lib/security';

// 📊 Analytics (exemple avec Plausible, à adapter)
import { initAnalytics, trackPageView } from './lib/analytics';

// 🛡️ Error boundary global (capture les erreurs React)
import GlobalErrorBoundary from './components/GlobalErrorBoundary';

// ⚙️ Service Worker pour PWA (mise en cache, offline)
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// 🧪 Validation des variables d'environnement
function validateEnv(): void {
  const required = ['VITE_API_URL', 'VITE_APP_NAME'];
  const missing = required.filter(key => !import.meta.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `❌ Variables d'environnement manquantes : ${missing.join(', ')}`
    );
  }
}

// ⏱️ Marquage de performance (pour mesurer le rendu initial)
if (import.meta.env.PROD) {
  performance.mark('app-start');
}

// 🔍 Vérification que l'élément racine existe
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error(
    '🚨 Élément #root introuvable. Vérifie ton fichier index.html.'
  );
}

// ======================================================
// 🛡️ SÉCURITÉ & ENVIRONNEMENT (production uniquement)
// ======================================================
if (import.meta.env.PROD) {
  // Empêche l'affichage dans une iframe (clickjacking)
  preventFraming();

  // Bloque le clic droit (protection du contenu)
  disableContextMenu();

  // Désactive les raccourcis devtools (F12, Ctrl+Shift+I, etc.)
  disableDevShortcuts();

  // Détection avancée de l'ouverture des devtools (alerte ou log)
  detectDevTools((isOpen) => {
    if (isOpen) {
      console.warn('⚠️ DevTools détectés – sois prudent avec les données sensibles.');
      // Tu peux aussi envoyer un événement à ton backend
    }
  });

  // Valide les variables d'environnement critiques
  validateEnv();

  // Initialise les analytics (exemple)
  initAnalytics({ domain: 'bulonet.com', api: import.meta.env.VITE_ANALYTICS_API });

  // Enregistre la première vue de page
  trackPageView(window.location.pathname);

  // Enregistre le service worker (PWA)
  serviceWorkerRegistration.register({
    onUpdate: (registration) => {
      // Nouveau contenu disponible → on propose un rechargement
      const shouldReload = window.confirm(
        '📦 Une nouvelle version de Bulonet est disponible. Recharger ?'
      );
      if (shouldReload) {
        window.location.reload();
      }
    },
    onSuccess: () => console.log('✅ Service worker enregistré avec succès.'),
  });
} else {
  // En développement, on peut activer des outils supplémentaires
  // (ex: pourquoi pas la validation d'env aussi ?)
  validateEnv(); // Optionnel, mais utile pour éviter les surprises
}

// ======================================================
// 🚀 RENDU DE L'APPLICATION
// ======================================================
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>
);

// ======================================================
// 📈 MESURE DE PERFORMANCE (fin du rendu)
// ======================================================
if (import.meta.env.PROD) {
  // On attend que le navigateur ait fini de peindre
  window.addEventListener('load', () => {
    performance.mark('app-end');
    performance.measure('app-render', 'app-start', 'app-end');
    const measure = performance.getEntriesByName('app-render')[0];
    console.log(`⏱️ Temps de rendu initial : ${measure.duration.toFixed(2)} ms`);
  });
}

// ======================================================
// 💡 CONSEILS / ORIENTATIONS
// ======================================================
// 1. Ce fichier est le cœur du démarrage – garde-le léger !
// 2. Toute la logique métier (routes, providers, contexte) doit rester dans App.tsx
//    ou dans des composants dédiés. Ici on ne fait que brancher les services globaux.
// 3. Si tu as plusieurs providers (Redux, Theme, i18n, etc.), tu peux les regrouper
//    dans un composant <AppProviders> à l'intérieur de App.tsx, pour garder main.tsx
//    encore plus propre.
// 4. La fonction `detectDevTools` est un plus sécurité ; tu peux l'activer seulement
//    si tu manipules des données très sensibles.
// 5. Pense à adapter les imports (analytics, serviceWorker, error boundary) selon
//    ton architecture réelle. Si ces fichiers n'existent pas encore, crée-les ou
//    commente les lignes correspondantes.
// ======================================================
