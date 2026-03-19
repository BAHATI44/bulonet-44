// ======================================================
// Fichier     : src/vite-env.d.ts
// Projet      : Bulonet 🚀
// Description : Déclarations de types pour l'environnement Vite.
//               Permet à TypeScript de reconnaître les spécificités
//               de Vite (import.meta.env, imports de fichiers, etc.)
//               et d'avoir l'autocomplétion sur les variables
//               d'environnement personnalisées.
// ======================================================

// 🔧 Directive de base Vite : apporte les types globaux de Vite
/// <reference types="vite/client" />

// ======================================================
// 📌 VARIABLES D'ENVIRONNEMENT SPÉCIFIQUES À BULONET
// ======================================================
// Ici on définit le typage de `import.meta.env` pour nos propres variables.
// Cela permet d'avoir de l'autocomplétion et de la vérification de type
// quand on utilise `import.meta.env.VITE_XXX` dans le code.
interface ImportMetaEnv {
  // 🔐 API
  readonly VITE_API_URL: string;               // URL de base de l'API backend
  readonly VITE_API_TIMEOUT?: string;           // Timeout en ms (optionnel)

  // 🛒 Frontend
  readonly VITE_APP_NAME: string;               // Nom de l'application (ex: "Bulonet")
  readonly VITE_APP_URL: string;                // URL publique du site
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production'; // Environnement

  // 📊 Analytics
  readonly VITE_ANALYTICS_ID?: string;           // Identifiant (ex: Plausible, Google Analytics)
  readonly VITE_ANALYTICS_API?: string;          // Endpoint API (optionnel)

  // 💳 Paiement
  readonly VITE_STRIPE_PUBLIC_KEY?: string;      // Clé publique Stripe
  readonly VITE_PAYPAL_CLIENT_ID?: string;       // Client ID PayPal

  // 📦 Features flags (optionnels)
  readonly VITE_ENABLE_PWA?: 'true' | 'false';   // Activer la PWA ?
  readonly VITE_ENABLE_AI_AGENTS?: 'true' | 'false'; // Activer les agents IA ?
  readonly VITE_ENABLE_INTERNATIONAL?: 'true' | 'false'; // Activer l'international ?

  // 🌍 Internationalisation
  readonly VITE_DEFAULT_LANGUAGE?: string;        // Langue par défaut (ex: 'fr')
  readonly VITE_SUPPORTED_LANGUAGES?: string;     // Langues supportées (ex: 'fr,en,es')

  // 🔒 Sécurité (optionnel)
  readonly VITE_RECAPTCHA_SITE_KEY?: string;      // Clé reCAPTCHA
}

// Étendre l'interface ImportMeta pour inclure notre type env
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ======================================================
// 🖼️ DÉCLARATIONS POUR LES IMPORTS DE FICHIERS STATIQUES
// ======================================================
// Ces déclarations permettent d'importer des images, des SVGs, des CSS, etc.
// sans que TypeScript ne les considère comme des modules inconnus.
// Elles sont généralement déjà fournies par "vite/client", mais on les
// redéclare ici pour être explicites et éventuellement les personnaliser.

// Images
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.jpg' {
  const src: string;
  export default src;
}
declare module '*.jpeg' {
  const src: string;
  export default src;
}
declare module '*.gif' {
  const src: string;
  export default src;
}
declare module '*.svg' {
  const src: string;
  export default src;
}
declare module '*.webp' {
  const src: string;
  export default src;
}
declare module '*.ico' {
  const src: string;
  export default src;
}

// Polices
declare module '*.woff' {
  const src: string;
  export default src;
}
declare module '*.woff2' {
  const src: string;
  export default src;
}
declare module '*.ttf' {
  const src: string;
  export default src;
}
declare module '*.eot' {
  const src: string;
  export default src;
}
declare module '*.otf' {
  const src: string;
  export default src;
}

// Styles
declare module '*.css' {
  const css: string;
  export default css;
}
declare module '*.scss' {
  const scss: string;
  export default scss;
}
declare module '*.sass' {
  const sass: string;
  export default sass;
}
declare module '*.less' {
  const less: string;
  export default less;
}

// Autres fichiers
declare module '*.json' {
  const value: any;
  export default value;
}
declare module '*.wasm' {
  const wasm: string;
  export default wasm;
}
declare module '*.txt' {
  const text: string;
  export default text;
}

// ======================================================
// ⚡ MODULES VIRTUELS SPÉCIFIQUES À VITE (optionnel)
// ======================================================
// Si tu utilises des fonctionnalités comme `import.meta.glob`, tu peux
// déclarer les modules virtuels ici (mais c'est généralement automatique).
declare module 'virtual:*' {
  const content: any;
  export default content;
}

// ======================================================
// 🛠️ UTILITAIRES SUPPLÉMENTAIRES (optionnel)
// ======================================================
// Par exemple, si tu veux un type pour les imports avec paramètres (ex: ?url, ?raw)
// Ces types sont déjà inclus dans "vite/client", mais on peut les raffiner.

// ======================================================
// 💡 CONSEILS & ORIENTATIONS
// ======================================================
// 1. Ce fichier est nécessaire pour que TypeScript comprenne l'environnement Vite.
//    Sans lui, `import.meta.env` serait typé comme `any` et les imports statiques
//    pourraient générer des erreurs de type.
// 2. Place-le à la racine du dossier `src` (ou à la racine du projet, mais `src` est plus logique).
// 3. Adapte les variables d'environnement selon les besoins réels de Bulonet.
//    N'hésite pas à ajouter ou supprimer des lignes dans `ImportMetaEnv`.
// 4. Les déclarations de modules pour les fichiers statiques sont redondantes avec
//    `vite/client`, mais les laisser ici ne fait pas de mal et peut servir de documentation.
// 5. Si tu utilises des fichiers particuliers (ex: `.mp4`, `.pdf`), ajoute-les.
// 6. Pense à maintenir ce fichier synchronisé avec le fichier `.env` du projet.
// ======================================================
