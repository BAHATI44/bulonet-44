// ======================================================
// Fichier     : src/components/admin/AdminLayout.tsx
// Projet      : Bulonet 🚀
// Description : Layout principal pour l'espace administrateur.
//               Gère l'authentification, l'affichage de la barre latérale,
//               l'en-tête avec titre, le menu utilisateur, les breadcrumbs,
//               et les meta-données (SEO). Intègre des vérifications de rôle
//               et une gestion d'erreur.
// ======================================================

import { ReactNode, useEffect, useState } from "react";
import { Navigate, useMatches, Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import SecurityBadge from "@/components/landing/SecurityBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, LogOut, Settings, User } from "lucide-react";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;               // Titre de la page (affiché dans l'en-tête et dans le <title>)
  subtitle?: string;            // Sous-titre optionnel
  requiredRole?: "admin" | "super_admin"; // Rôle minimum requis (par défaut "admin")
}

/**
 * Génère les breadcrumbs à partir des `handle` des routes actives.
 * Pour que cela fonctionne, chaque route doit avoir un `handle` avec un objet `crumb`.
 * Exemple : `handle: { crumb: () => "Tableau de bord" }`
 */
const useBreadcrumbs = () => {
  const matches = useMatches();
  const crumbs = matches
    .filter((match) => match.handle && typeof match.handle === "object" && "crumb" in match.handle)
    .map((match) => ({
      path: match.pathname,
      title: (match.handle as any).crumb(match.data) || match.pathname,
    }));
  return crumbs;
};

const AdminLayout = ({ children, title, subtitle, requiredRole = "admin" }: AdminLayoutProps) => {
  const { user, loading, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const breadcrumbs = useBreadcrumbs();

  // Vérification du rôle (par exemple, super_admin peut tout faire)
  const hasRequiredRole = requiredRole === "admin" ? isAdmin : isAdmin && user?.role === "super_admin";

  // Redirection après déconnexion
  const handleSignOut = async () => {
    await signOut();
    toast.success("Déconnexion réussie");
  };

  // État de chargement
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Non authentifié → redirection vers login
  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  // Authentifié mais rôle insuffisant → afficher une page d'accès interdit
  if (!hasRequiredRole) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">⛔ Accès interdit</h1>
          <p className="mt-2 text-muted-foreground">
            Vous n'avez pas les droits suffisants pour accéder à cette page.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  // Initiales pour l'avatar par défaut
  const initials = user.email
    ? user.email
        .split("@")[0]
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  return (
    <SidebarProvider>
      {/* SEO – titre de la page */}
      <Helmet>
        <title>{title} - Bulonet Admin</title>
      </Helmet>

      <div className="flex min-h-screen w-full">
        {/* Barre latérale de navigation */}
        <AdminSidebar />

        {/* Contenu principal */}
        <div className="flex flex-1 flex-col">
          {/* En-tête sticky */}
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              {/* Bouton d'ouverture/fermeture de la sidebar */}
              <SidebarTrigger />

              {/* Fil d'Ariane (breadcrumbs) */}
              {breadcrumbs.length > 0 && (
                <nav className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
                  {breadcrumbs.map((crumb, index) => (
                    <span key={crumb.path} className="flex items-center">
                      {index > 0 && <ChevronRight className="mx-1 h-3 w-3" />}
                      {index === breadcrumbs.length - 1 ? (
                        <span className="font-medium text-foreground">{crumb.title}</span>
                      ) : (
                        <Link to={crumb.path} className="hover:text-foreground transition-colors">
                          {crumb.title}
                        </Link>
                      )}
                    </span>
                  ))}
                </nav>
              )}

              {/* Titre de la page (utilisé si pas de breadcrumbs ou pour mobile) */}
              <h1 className="text-lg font-semibold text-foreground sm:hidden">{title}</h1>
            </div>

            {/* Zone droite : sécurité + menu utilisateur */}
            <div className="flex items-center gap-2">
              <SecurityBadge />

              {/* Menu utilisateur avec avatar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Administrateur</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/admin/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Paramètres</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Zone principale avec padding */}
          <main className="flex-1 p-6">
            {/* Affiche le sous-titre si présent */}
            {subtitle && <p className="mb-4 text-sm text-muted-foreground">{subtitle}</p>}
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;

// ====================================================
// 💡 CONSEILS & ORIENTATIONS
// ====================================================
// - Ce fichier doit être placé dans `src/components/admin/AdminLayout.tsx`.
// - Il utilise le hook `useAuth` pour récupérer l'utilisateur, l'état de chargement,
//   et la fonction de déconnexion. Assurez-vous que `useAuth` fournit également
//   `isAdmin` et éventuellement `role` (pour super_admin).
// - Les breadcrumbs fonctionnent grâce aux `handle` des routes. Exemple de route :
//   ```tsx
//   <Route
//     path="products"
//     element={<ProductsPage />}
//     handle={{ crumb: () => "Produits" }}
//   />
//   ```
// - Pour les routes paramétrées, la fonction `crumb` reçoit les données de la route
//   (ex: `match.data`) ; vous pouvez y accéder pour afficher le nom du produit.
// - Le rôle requis peut être ajusté par la prop `requiredRole`. Si vous avez plusieurs
//   niveaux (admin, super_admin), adaptez la logique dans `hasRequiredRole`.
// - Le menu utilisateur suppose l'existence des routes `/admin/profile` et
//   `/admin/settings`. Créez-les si nécessaire.
// - L'avatar affiche les initiales de l'email. Pour un vrai avatar, récupérez l'URL
//   depuis le profil utilisateur (à implémenter dans `useAuth`).
// - La sécurité est renforcée par un badge (déjà présent) et une vérification de rôle.
// - Pensez à installer `react-helmet-async` pour le SEO : `npm install react-helmet-async`
// - Les composants UI (DropdownMenu, Avatar, Skeleton) viennent de shadcn/ui.
//   Installez-les si nécessaire.
// ====================================================
