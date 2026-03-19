// ======================================================
// Fichier     : vitest.config.ts
// Projet      : Bulonet 🚀
// Description : Configuration de Vitest pour les tests unitaires
//               et d'intégration. Définit l'environnement,
//               les alias, la couverture de code, les reporters,
//               et les paramètres de parallélisation.
// ======================================================

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Plugins Vite – ici uniquement React pour le support JSX
  plugins: [react()],

  // ====================================================
  // Configuration des tests
  // ====================================================
  test: {
    // 🧪 Environnement : jsdom pour simuler un navigateur
    environment: 'jsdom',

    // 🌍 Rendre les APIs de test globales (describe, it, expect...)
    globals: true,

    // 📁 Fichier(s) de configuration exécutés avant chaque test
    setupFiles: ['./src/test/setup.ts'],

    // 🔍 Inclusion des fichiers de test
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // ⏱️ Timeouts
    testTimeout: 10000,               // 10 secondes par test
    hookTimeout: 15000,                // 15 secondes pour les hooks (beforeEach, etc.)

    // 🧵 Parallélisation (par défaut, Vitest utilise des workers)
    pool: 'threads',                    // ou 'forks' selon l'environnement
    poolOptions: {
      threads: {
        singleThread: false,            // Utiliser plusieurs threads
        isolate: true,                  // Isoler les tests entre eux
      },
    },

    // 📊 Couverture de code
    coverage: {
      provider: 'v8',                    // Utiliser v8 (ou 'istanbul')
      reporter: ['text', 'json', 'html'], // Rapports : console, JSON, HTML
      reportsDirectory: './coverage',      // Dossier de sortie
      include: ['src/**/*.{ts,tsx}'],      // Fichiers à couvrir
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**/*',
        'src/**/index.ts',                 // Ignorer les fichiers d'export
        'src/**/*.d.ts',
      ],
      all: true,                           // Inclure même les fichiers non testés
      thresholds: {
        lines: 80,                         // Seuils de couverture (optionnel)
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },

    // 📝 Reporters (affichage des résultats)
    reporters: [
      'default',                            // Reporter par défaut (Terminal)
      'json',                               // Rapport JSON (utile pour CI)
      ['junit', { outputFile: './junit.xml' }], // Rapport JUnit pour intégration CI
    ],

    // 📸 Snapshots
    snapshotFormat: {
      printBasicPrototype: false,
    },

    // 🧪 Tests en mode watch (développement)
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**', '**/coverage/**'],
    },

    // 🔄 Environnement de test (jsdom déjà défini)
    environmentOptions: {
      jsdom: {
        url: 'http://localhost',           // URL de base simulée
      },
    },

    // 📦 Résolution des alias (déjà défini ci-dessous, mais on peut préciser)
    alias: {
      '@': path.resolve(__dirname, './src'),
    },

    // 🚫 Restriction des imports (optionnel)
    // deps: {
    //   inline: [], // Dépendances à transformer
    // },
  },

  // ====================================================
  // Résolution des alias (partagé avec Vite)
  // ====================================================
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

// ====================================================
// 💡 CONSEILS & ORIENTATIONS
// ====================================================
// - Ce fichier est nécessaire pour exécuter les tests avec Vitest.
// - Assurez-vous que le répertoire `src/test/setup.ts` existe et contient
//   les imports globaux (par exemple, `@testing-library/jest-dom`).
// - Adaptez les seuils de couverture (`thresholds`) selon les exigences du projet.
// - Les rapports JSON et JUnit sont utiles pour l'intégration continue (CI).
// - Pour des tests plus rapides, vous pouvez ajuster le nombre de threads
//   avec `poolOptions.threads.maxThreads`.
// - Si vous utilisez des tests avec des composants qui nécessitent des polyfills,
//   ajoutez-les dans `setupFiles`.
// - Pensez à installer les dépendances nécessaires : `vitest`, `jsdom`, `@vitest/coverage-v8`, etc.
// - Exemple d'installation : `npm install -D vitest jsdom @vitest/coverage-v8 @testing-library/jest-dom`
// ====================================================
