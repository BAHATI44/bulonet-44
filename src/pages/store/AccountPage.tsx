import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StoreLayout from "@/components/store/StoreLayout";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, Package, LogOut, Clock, Heart, Loader2 } from "lucide-react";

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  confirmed: { label: "Confirmée", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  processing: { label: "En cours", color: "bg-primary/10 text-primary border-primary/30" },
  shipped: { label: "Expédiée", color: "bg-violet-500/10 text-violet-600 border-violet-500/30" },
  delivered: { label: "Livrée", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  cancelled: { label: "Annulée", color: "bg-destructive/10 text-destructive border-destructive/30" },
  refunded: { label: "Remboursée", color: "bg-muted text-muted-foreground border-border" },
};

const AccountPage = () => {
  const { user, loading, signOut } = useAuth();
  const { formatPrice } = useStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/store/auth");
  }, [loading, user, navigate]);

  // Profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({ display_name: displayName, updated_at: new Date().toISOString() }).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["profile"] }); toast.success("Profil mis à jour"); },
    onError: (e) => toast.error(e.message),
  });

  // Orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*, products(*))").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Wishlist
  const { data: wishlist, isLoading: wishlistLoading } = useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("wishlist_items").select("*, products(*)").eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const removeWishlistItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wishlist_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wishlist"] }); toast.success("Retiré des favoris"); },
  });

  if (loading) return <StoreLayout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></StoreLayout>;
  if (!user) return null;

  return (
    <StoreLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mon compte</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" /> Déconnexion
          </Button>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders" className="gap-1.5"><Package className="h-4 w-4" />Commandes</TabsTrigger>
            <TabsTrigger value="wishlist" className="gap-1.5"><Heart className="h-4 w-4" />Favoris</TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5"><User className="h-4 w-4" />Profil</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            {ordersLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : !orders?.length ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-2 text-muted-foreground">Aucune commande pour le moment.</p>
                <Button className="mt-4" onClick={() => navigate("/store")}>Découvrir le catalogue</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const status = statusLabels[order.status] ?? statusLabels.pending;
                  return (
                    <div key={order.id} className="rounded-xl bg-card p-5 shadow-soft">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-muted-foreground">{order.order_number}</span>
                          <Badge variant="outline" className={`text-[10px] ${status.color}`}>{status.label}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(order.created_at).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {(order.order_items as any[])?.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{item.products?.name ?? "Produit"} × {item.quantity}</span>
                            <span className="font-medium tabular-nums">{formatPrice(Number(item.total_price))}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        <span className="text-xs text-muted-foreground">{order.currency_code}</span>
                        <span className="font-bold tabular-nums text-foreground">{formatPrice(Number(order.total_amount))}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="wishlist">
            {wishlistLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : !wishlist?.length ? (
              <div className="text-center py-12">
                <Heart className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-2 text-muted-foreground">Aucun favori pour le moment.</p>
                <Button className="mt-4" onClick={() => navigate("/store")}>Découvrir le catalogue</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {wishlist.map((item: any) => (
                  <div key={item.id} className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/50" onClick={() => navigate(`/store/product/${item.product_id}`)}>
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
                      {item.products?.image_url ? (
                        <img src={item.products.image_url} alt={item.products.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground"><Package className="h-6 w-6" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.products?.name}</p>
                      <p className="text-xs text-muted-foreground">{formatPrice(Number(item.products?.base_price || 0))}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={(e) => { e.stopPropagation(); removeWishlistItem.mutate(item.id); }}>
                      <Heart className="h-4 w-4 fill-current" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile">
            <div className="max-w-md space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email || ""} disabled className="bg-secondary" />
              </div>
              <div className="space-y-2">
                <Label>Nom d'affichage</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Votre nom" />
              </div>
              <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending} className="gap-1.5">
                {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enregistrer
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </StoreLayout>
  );
};

export default AccountPage;
