// ======================================================
// Fichier     : src/hooks/useIsMobile.ts
// Projet      : Bulonet 🚀
// Description : Hook personnalisé pour détecter si l'écran
//               est en mode mobile (largeur < breakpoint).
//               Compatible SSR, avec breakpoint configurable,
//               et optimisation des performances.
// ======================================================

import { useState, useEffect, useCallback } from 'react';

// ====================================================
// 1. CONSTANTES PAR DÉFAUT
// ====================================================
const DEFAULT_MOBILE_BREAKPOINT = 768; // en pixels

// ====================================================
// 2. HOOK PRINCIPAL
// ====================================================

/**
 * Hook qui détecte si la largeur de la fenêtre est inférieure
 * à un seuil donné (mode mobile).
 *
 * @param breakpoint - Largeur maximale considérée comme mobile (défaut: 768px)
 * @returns `true` si l'écran est en mobile, `false` sinon.
 *
 * @example
 * const isMobile = useIsMobile(); // breakpoint par défaut 768px
 * const isTablet = useIsMobile(1024); // breakpoint personnalisé 1024px
 */
export function useIsMobile(breakpoint: number = DEFAULT_MOBILE_BREAKPOINT): boolean {
  // État initial : on part du principe que ce n'est pas mobile
  // (sécurité pour le SSR où window n'existe pas)
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Fonction de mise à jour basée sur la largeur actuelle
  const checkMobile = useCallback(() => {
    if (typeof window === 'undefined') return; // SSR : on ne fait rien
    setIsMobile(window.innerWidth < breakpoint);
  }, [breakpoint]);

  useEffect(() => {
    // Vérification initiale
    checkMobile();

    // Création d'un média query pour réagir aux changements de taille
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    // Gestionnaire d'événement
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    // Ajout de l'écouteur (version moderne)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback pour les anciens navigateurs (Safari < 14)
      mediaQuery.addListener(handleChange);
    }

    // Nettoyage
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [checkMobile, breakpoint]); // Re‑créer l'effet si le breakpoint change

  return isMobile;
}

// ====================================================
// 💡 CONSEILS & ORIENTATIONS
// ====================================================
// - Ce hook est idéal pour les composants qui doivent adapter
//   leur rendu en fonction de la taille de l'écran.
// - Il est compatible SSR : la valeur initiale est `false` côté serveur,
//   puis se met à jour côté client après hydratation.
// - Pour éviter des recalculs inutiles, le hook utilise `useCallback`
//   et ne se ré‑abonne que si le breakpoint change.
// - Si vous avez besoin de la valeur dans plusieurs composants,
//   préférez un contexte ou un store (zustand) pour partager l'état.
// - Le hook peut être étendu pour renvoyer également la largeur
//   exacte si nécessaire (ex: `useWindowSize`).
// ====================================================
