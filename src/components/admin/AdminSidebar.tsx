import { useMemo, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "react-router-dom";
import { LayoutDashboard, Package, Globe, Coins, ShoppingCart, Download, LogOut, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  exact?: boolean;
  badgeQueryKey?: string;
}

const navItems: NavItem[] = [
  { title: "Tableau de bord", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Produits", url: "/admin/products", icon: Package, badgeQueryKey: "pendingProducts" },
  { title: "Import", url: "/admin/import", icon: Download },
  { title: "Marchés", url: "/admin/markets", icon: Globe },
  { title: "Devises", url: "/admin/currencies", icon: Coins },
  { title: "Commandes", url: "/admin/orders", icon: ShoppingCart, badgeQueryKey: "pendingOrders" },
  { title: "Agents IA", url: "/admin/ai-agents", icon: Zap },
];

const useBadgeValue = (key?: string) => {
  const { data } = useQuery({
    queryKey: ["admin-badge", key],
    queryFn: async () => {
      if (key === "pendingOrders") {
        const { count } = await supabase.from("orders").select("*", { count: "exact", head: true }).in("status", ["pending", "processing"]);
        return count || 0;
      }
      if (key === "pendingProducts") {
        const { count } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", false);
        return count || 0;
      }
      return null;
    },
    enabled: !!key,
    staleTime: 1000 * 60 * 5,
  });
  return data;
};

const SidebarNavItem = memo(({ item, collapsed, locationPath }: { item: NavItem; collapsed: boolean; locationPath: string }) => {
  const badgeValue = useBadgeValue(item.badgeQueryKey);
  const isActive = item.exact ? locationPath === item.url : locationPath.startsWith(item.url);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
        <Link to={item.url} className={cn("flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors", "hover:bg-muted/70", isActive && "bg-muted font-medium text-primary")}>
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{item.title}</span>
              {badgeValue != null && badgeValue > 0 && (
                <Badge variant="destructive" className="ml-auto text-xs">{badgeValue > 99 ? "99+" : badgeValue}</Badge>
              )}
            </>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});
SidebarNavItem.displayName = "SidebarNavItem";

const AdminSidebar = memo(() => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();

  const initials = user?.email ? user.email.split("@")[0].slice(0, 2).toUpperCase() : "AD";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Déconnexion réussie");
  };

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary shadow-sm">
                <Zap className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              {!collapsed && <span className="text-sm font-bold tracking-tight text-foreground">BULONET</span>}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarNavItem key={item.url} item={item} collapsed={collapsed} locationPath={location.pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium text-foreground">{user?.email}</p>
              <p className="truncate text-[10px] text-muted-foreground">Administrateur</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleSignOut} title="Déconnexion">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Déconnexion">
                <button onClick={handleSignOut} className="flex w-full items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted/70 hover:text-foreground">
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
