// ======================================================
// Fichier     : src/components/admin/AdminSidebar.tsx
// Projet      : Bulonet 🚀
// Description : Barre latérale de navigation pour l'espace administrateur.
//               Gère l'affichage des liens, le repli (collapse),
//               la détection des routes actives, les badges dynamiques,
//               le filtrage selon les rôles, et les informations utilisateur.
//               Intègre des requêtes réelles pour les notifications (commandes, produits).
// ======================================================

import { useMemo, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Globe,
  Coins,
  ShoppingCart,
  Download,
  LogOut,
  Zap,
  Settings,
  Users,
  Shield,
  ChevronDown,
} from "lucide-react";
import { NavLink } from "@/components/ui/NavLink"; // Notre composant amélioré
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ====================================================
// 1. CONFIGURATION DES ÉLÉMENTS DE NAVIGATION
//    (avec rôles, badges dynamiques, sous-menus)
// ====================================================

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  /** Si true, la route est exacte (utile pour "/admin") */
  exact?: boolean;
  /** Rôle minimal requis pour voir cet élément (admin, super_admin, etc.) */
  requiredRole?: string;
  /** Fonction asynchrone pour obtenir un badge (nombre, etc.) */
  badgeQueryKey?: string; // Clé pour la requête (ex: "pendingOrders")
  /** Sous-éléments (pour les menus déroulants) */
  children?: Omit<NavItem, "children" | "badgeQueryKey">[];
}

const navItems: NavItem[] = [
  {
    title: "Tableau de bord",
    url: "/admin",
    icon: LayoutDashboard,
    exact: true,
    requiredRole: "admin",
  },
  {
    title: "Produits",
    url: "/admin/products",
    icon: Package,
    requiredRole: "admin",
    badgeQueryKey: "pendingProducts", // Nombre de produits en attente de validation
  },
  {
    title: "Import",
    url: "/admin/import",
    icon: Download,
    requiredRole: "admin",
  },
  {
    title: "Marchés",
    url: "/admin/markets",
    icon: Globe,
    requiredRole: "admin",
  },
  {
    title: "Devises",
    url: "/admin/currencies",
    icon: Coins,
    requiredRole: "admin",
  },
  {
    title: "Commandes",
    url: "/admin/orders",
    icon: ShoppingCart,
    requiredRole: "admin",
    badgeQueryKey: "pendingOrders",
  },
  {
    title: "Agents IA",
    url: "/admin/ai-agents",
    icon: Zap,
    requiredRole: "admin",
  },
  // Éléments réservés aux super administrateurs
  {
    title: "Administration",
    url: "/admin/users",
    icon: Users,
    requiredRole: "super_admin",
    children: [
      {
        title: "Utilisateurs",
        url: "/admin/users",
        icon: Users,
      },
      {
        title: "Rôles",
        url: "/admin/roles",
        icon: Shield,
      },
      {
        title: "Paramètres",
        url: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

// ====================================================
// 2. HOOK PERSONNALISÉ POUR LES BADGES (requêtes réelles)
// ====================================================

const useBadgeValue = (badgeQueryKey?: string) => {
  const { data } = useQuery({
    queryKey: ["admin-badge", badgeQueryKey],
    queryFn: async () => {
      if (!badgeQueryKey) return null;
      switch (badgeQueryKey) {
        case "pendingOrders":
          // Compter les commandes avec statut "pending" ou "processing"
          const { count: ordersCount, error: ordersError } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .in("status", ["pending", "processing"]);
          if (ordersError) throw ordersError;
          return ordersCount || 0;
        case "pendingProducts":
          // Compter les produits inactifs (en attente de validation)
          const { count: productsCount, error: productsError } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("is_active", false);
          if (productsError) throw productsError;
          return productsCount || 0;
        default:
          return null;
      }
    },
    enabled: !!badgeQueryKey,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Rafraîchir toutes les 5 min
  });
  return data;
};

// ====================================================
// 3. COMPOSANT POUR UN ÉLÉMENT DE MENU (avec badge)
// ====================================================

const SidebarNavItem = memo(
  ({
    item,
    collapsed,
    locationPath,
  }: {
    item: NavItem;
    collapsed: boolean;
    locationPath: string;
  }) => {
    const badgeValue = useBadgeValue(item.badgeQueryKey);
    const isActive = item.exact
      ? locationPath === item.url
      : locationPath.startsWith(item.url);

    // Si l'élément a des enfants, on utilise un Collapsible
    if (item.children && item.children.length > 0) {
      return (
        <Collapsible defaultOpen={isActive} className="w-full">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                className={cn(
                  "flex w-full items-center justify-between gap-2",
                  isActive && "bg-muted font-medium text-primary"
                )}
              >
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="flex-1 truncate text-left">{item.title}</span>}
                </div>
                {!collapsed && <ChevronDown className="h-4 w-4 transition-transform ui-open:rotate-180" />}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.children.map((child) => {
                  const childActive = child.exact
                    ? locationPath === child.url
                    : locationPath.startsWith(child.url);
                  return (
                    <SidebarMenuSubItem key={child.url}>
                      <SidebarMenuSubButton asChild isActive={childActive}>
                        <NavLink to={child.url} end={child.exact}>
                          <child.icon className="h-4 w-4 mr-2" />
                          {!collapsed && child.title}
                        </NavLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    // Élément simple
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
          <NavLink
            to={item.url}
            end={item.exact}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              "hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            activeClassName="bg-muted font-medium text-primary"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 truncate">{item.title}</span>
                {badgeValue !== undefined && badgeValue > 0 && (
                  <Badge variant={badgeValue > 0 ? "destructive" : "secondary"} className="ml-auto text-xs">
                    {badgeValue > 99 ? "99+" : badgeValue}
                  </Badge>
                )}
              </>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }
);

SidebarNavItem.displayName = "SidebarNavItem";

// ====================================================
// 4. COMPOSANT PRINCIPAL (memo pour éviter les re-rendus inutiles)
// ====================================================

const AdminSidebar = memo(() => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut, isAdmin, role } = useAuth();

  // Filtrer les éléments selon le rôle de l'utilisateur
  const filteredNavItems = useMemo(() => {
    return navItems.filter((item) => {
      if (!item.requiredRole) return true;
      if (item.requiredRole === "admin") return isAdmin;
      // Ici on suppose que le rôle est stocké dans `user.role` (super_admin, etc.)
      if (item.requiredRole === "super_admin") return role === "super_admin";
      return false;
    });
  }, [isAdmin, role]);

  // Initiales pour l'avatar
  const initials = user?.email
    ? user.email
        .split("@")[0]
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  // Gestion de la déconnexion avec confirmation
  const handleSignOut = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      await signOut();
      toast.success("Déconnexion réussie");
    }
  };

  return (
    <Sidebar collapsible="icon" variant="floating">
      {/* ========== EN-TÊTE ========== */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary shadow-sm">
                <Zap className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              {!collapsed && (
                <span className="text-sm font-bold tracking-tight text-foreground">
                  BULONET ADMIN
                </span>
              )}
            </div>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarNavItem
                  key={item.url}
                  item={item}
                  collapsed={collapsed}
                  locationPath={location.pathname}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ========== PIED DE PAGE (utilisateur + déconnexion) ========== */}
      <SidebarFooter>
        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-md border border-border bg-card p-3 shadow-soft">
            <Avatar className="h-8 w-8">
              {user?.user_metadata?.avatar_url ? (
                <AvatarImage src={user.user_metadata.avatar_url} alt={user.email} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium text-foreground">
                {user?.user_metadata?.full_name || user?.email}
              </p>
              <p className="truncate text-[10px] text-muted-foreground capitalize">
                {role === "super_admin" ? "Super Admin" : "Administrateur"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          // Version repliée : seulement le bouton de déconnexion avec tooltip
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Déconnexion">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
});

AdminSidebar.displayName = "AdminSidebar";

export default AdminSidebar;

// ====================================================
// 💡 CONSEILS & ORIENTATIONS
// ====================================================
// - Ce fichier est essentiel pour la navigation dans l'admin.
// - Il utilise `useAuth` pour récupérer l'utilisateur, son rôle, et la fonction `signOut`.
//   Assurez-vous que `useAuth` fournisse `isAdmin` et `role` (ex: "admin" ou "super_admin").
// - Les badges sont alimentés par des requêtes React Query réelles vers Supabase.
//   Adaptez les compteurs selon vos tables et statuts (pendingOrders, pendingProducts).
// - Les sous-menus sont implémentés via Collapsible. Vous pouvez les étendre.
// - La déconnexion inclut une confirmation pour éviter les erreurs.
// - Le composant est mémoïsé (`memo`) pour des performances optimales.
// - Pensez à installer les composants nécessaires : Collapsible (shadcn/ui).
// - Pour les super admins, nous utilisons `role === "super_admin"`. Modifiez selon votre logique.
// - Les requêtes sont configurées avec un `refetchInterval` pour rafraîchir périodiquement.
//   Vous pouvez aussi utiliser des subscriptions en temps réel (Realtime) si nécessaire.
// ====================================================
