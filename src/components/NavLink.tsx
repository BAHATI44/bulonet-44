// ======================================================
// Fichier     : src/components/ui/NavLink.tsx
// Projet      : Bulonet 🚀
// Description : Composant de lien de navigation amélioré.
//               Wrapper autour de `NavLink` de React Router
//               avec gestion des classes actives/en attente,
//               détection automatique des liens externes,
//               support du préfixe `to` relatif, et options
//               d'analytics. S'intègre avec Tailwind CSS via `cn`.
// ======================================================

import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef, AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// ====================================================
// 1. TYPES – Étendre les props de NavLink et ajouter nos options
// ====================================================
export interface BulonetNavLinkProps extends Omit<NavLinkProps, "className"> {
  /** Classes CSS par défaut (fusionnées avec active/pending) */
  className?: string;
  /** Classes ajoutées quand le lien est actif */
  activeClassName?: string;
  /** Classes ajoutées quand le lien est en attente (pending) */
  pendingClassName?: string;
  /** Désactive les styles par défaut (utile pour des composants custom) */
  unstyled?: boolean;
  /** Données à envoyer à l'analytics lors du clic (optionnel) */
  trackingData?: Record<string, any>;
  /** Props additionnelles pour le rendu <a> externe */
  externalProps?: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick">;
}

// ====================================================
// 2. COMPOSANT PRINCIPAL
// ====================================================
const NavLink = forwardRef<HTMLAnchorElement, BulonetNavLinkProps>(
  (
    {
      to,
      className = "",
      activeClassName = "",
      pendingClassName = "",
      unstyled = false,
      trackingData,
      externalProps,
      onClick,
      children,
      ...props // autres props de NavLink (end, reloadDocument, etc.)
    },
    ref
  ) => {
    // ==================================================
    // 🔗 Détection des liens externes (http://, https://, //)
    // ==================================================
    const isExternal =
      typeof to === "string" &&
      (to.startsWith("http://") || to.startsWith("https://") || to.startsWith("//"));

    // ==================================================
    // 📊 Gestion du clic (analytics, etc.)
    // ==================================================
    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      // Appeler le onClick original s'il existe
      if (onClick) {
        onClick(event);
      }
      // Si trackingData est fourni, on peut déclencher un événement
      if (trackingData && !event.defaultPrevented) {
        // Exemple d'envoi à un service d'analytics (à adapter)
        // window.analytics?.track('Link Click', { to, ...trackingData });
        console.log("🔍 Tracking (à implémenter) :", { to, ...trackingData });
      }
    };

    // ==================================================
    // 🧩 Rendu conditionnel : lien externe vs interne
    // ==================================================
    if (isExternal) {
      return (
        <a
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          href={to as string}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(!unstyled && className)} // seulement les classes de base (pas d'état)
          onClick={handleClick}
          {...externalProps}
        >
          {children}
        </a>
      );
    }

    // ==================================================
    // 🔄 Lien interne (React Router)
    // ==================================================
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(
            !unstyled && className, // classes de base si unstyled est faux
            isActive && activeClassName,
            isPending && pendingClassName
          )
        }
        onClick={handleClick}
        {...props} // end, replace, etc.
      >
        {children}
      </RouterNavLink>
    );
  }
);

NavLink.displayName = "NavLink";

export { NavLink };

// ====================================================
// 💡 CONSEILS & ORIENTATIONS
// ====================================================
// - Placez ce fichier dans `src/components/ui/NavLink.tsx`.
// - Utilisez ce composant partout où vous avez besoin de liens
//   avec des états actifs (navigation, menus, tabs).
// - Pour les liens externes, le composant génère automatiquement
//   un <a> avec target="_blank" et rel="noopener noreferrer".
// - La prop `unstyled` est utile quand vous voulez contrôler
//   totalement le style sans fusion avec les classes par défaut.
// - Pour l'analytics, passez un objet `trackingData` ; le composant
//   se contente de logger dans la console en développement.
//   Implémentez votre propre logique dans `handleClick`.
// - Pensez à importer `cn` depuis `@/lib/utils`.
// - Les props `activeClassName` et `pendingClassName` permettent
//   de surcharger facilement les styles selon l'état.
// - Compatible avec toutes les props de `NavLink` de React Router v6
//   (end, reloadDocument, etc.).
// - Exemple d'utilisation :
//   ```tsx
//   <NavLink to="/dashboard" activeClassName="text-primary font-bold" pendingClassName="opacity-50">
//     Tableau de bord
//   </NavLink>
//   ```
// ====================================================
