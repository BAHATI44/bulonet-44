// ======================================================
// Fichier     : src/lib/utils.ts
// Projet      : Bulonet 🚀
// Description : Fonctions utilitaires génériques.
//               Contient notamment la fonction `cn` pour
//               la fusion intelligente de classes Tailwind
//               avec cache et aide au débogage en développement.
// ======================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ====================================================
// 🧠 CACHE POUR OPTIMISER LES FUSIONS RÉPÉTÉES
// ====================================================
// Stocke les résultats déjà calculés pour éviter
// de refusionner les mêmes combinaisons de classes.
// Utilise un cache LRU simple avec une taille maximale.
const mergeCache = new Map<string, string>();
const MAX_CACHE_SIZE = 500;

// ====================================================
// 🛠️ FONCTION PRINCIPALE : cn
// Fusionne les classes Tailwind avec gestion des conflits
// ====================================================

/**
 * Fusionne intelligemment des classes CSS, en priorisant
 * les classes Tailwind et en résolvant les conflits
 * (ex: `p-2` et `p-4` → la dernière l'emporte).
 *
 * @param inputs - Liste de valeurs de classes (string, objet, tableau, falsy)
 * @returns Chaîne de classes prête à être utilisée dans un composant
 *
 * @example
 * cn('p-4', 'text-red-500', { 'bg-blue': isActive }, ['flex', 'items-center'])
 * // → "p-4 text-red-500 bg-blue flex items-center" (si isActive = true)
 */
export function cn(...inputs: ClassValue[]): string {
  // Générer une clé de cache basée sur les entrées
  const cacheKey = JSON.stringify(inputs);

  // Vérifier le cache
  if (mergeCache.has(cacheKey)) {
    return mergeCache.get(cacheKey)!;
  }

  // Fusion standard avec clsx puis tailwind-merge
  const merged = twMerge(clsx(inputs));

  // Mettre en cache (taille limitée)
  if (mergeCache.size >= MAX_CACHE_SIZE) {
    // Supprimer la plus ancienne entrée (simple stratégie)
    const firstKey = mergeCache.keys().next().value;
    if (firstKey) mergeCache.delete(firstKey);
  }
  mergeCache.set(cacheKey, merged);

  // En mode développement, effectuer des vérifications supplémentaires
  if (import.meta.env.DEV) {
    detectConflicts(merged);
  }

  return merged;
}

// ====================================================
// 🔍 DÉTECTION DE CONFLITS (mode développement uniquement)
// ====================================================
// Analyse la chaîne résultante pour trouver des classes
// potentiellement conflictuelles (ex: `p-2` et `p-4` ensemble)
// et affiche un avertissement dans la console.

const conflictPatterns = [
  // Espacements
  { pattern: /\b(p|m|px|py|pt|pr|pb|pl)-(\d+)\b.*\b(p|m|px|py|pt|pr|pb|pl)-(\d+)\b/ },
  // Tailles de texte
  { pattern: /\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b.*\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/ },
  // Couleurs de texte
  { pattern: /\btext-(red|blue|green|yellow|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose)-\d{1,3}\b.*\btext-(red|blue|green|yellow|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose)-\d{1,3}\b/ },
  // Display
  { pattern: /\b(block|inline-block|inline|flex|grid|hidden)\b.*\b(block|inline-block|inline|flex|grid|hidden)\b/ },
  // Flex direction
  { pattern: /\b(flex-row|flex-col)\b.*\b(flex-row|flex-col)\b/ },
];

function detectConflicts(classString: string) {
  for (const { pattern } of conflictPatterns) {
    const matches = classString.match(new RegExp(pattern, 'g'));
    if (matches && matches.length > 1) {
      console.warn(
        `⚠️ [BULONET] Conflit potentiel détecté dans les classes CSS :\n`,
        `   Classes : ${classString}\n`,
        `   Le pattern ${pattern} a été trouvé plusieurs fois. Vérifiez votre usage.`
      );
    }
  }
}

// ====================================================
// 🧪 FONCTIONS UTILITAIRES SUPPLÉMENTAIRES (optionnel)
// ====================================================

/**
 * Version simplifiée de `cn` sans cache ni avertissements,
 * utile pour les cas où on ne veut pas de surcharge.
 */
export function simpleCn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Réinitialise manuellement le cache (utile pour les tests).
 */
export function clearCnCache() {
  mergeCache.clear();
}

// ====================================================
// 💡 CONSEILS & ORIENTATIONS
// ====================================================
// - Utilisez `cn` partout où vous devez combiner des classes Tailwind,
//   notamment dans les composants pour les props `className`.
// - Le cache améliore les performances dans les composants qui rendent
//   souvent avec les mêmes combinaisons de classes.
// - Les avertissements de conflit en développement aident à repérer
//   des erreurs comme `p-2 p-4` (seule la dernière s'applique).
// - Si vous ne voulez pas de cache, utilisez `simpleCn`.
// - Pensez à vider le cache dans les tests avec `clearCnCache()`.
// - Ce fichier est essentiel au projet ; il est importé dans de nombreux
//   composants UI.
// ====================================================
