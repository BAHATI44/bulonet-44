import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StoreLayout from "@/components/store/StoreLayout";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Package, LogOut, Clock, ShoppingBag } from "lucide-react";
import { useEffect } from "react";

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
  const { user, signOut, loading } = useAuth();
  const { formatPrice } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/store/auth");
  }, [loading, user, navigate]);

  const { data: orders } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, image_url))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (loading || !user) {
    return (
      <StoreLayout>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Profile header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Mon compte</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={async () => { await signOut(); navigate("/store"); }}
          >
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion
          </Button>
        </div>

        {/* Orders */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Package className="h-5 w-5 text-primary" />
            Mes commandes
          </h2>

          {!orders || orders.length === 0 ? (
            <div className="rounded-xl bg-card p-12 text-center shadow-soft">
              <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">Aucune commande pour le moment</p>
              <Button className="mt-4" onClick={() => navigate("/store")}>
                Découvrir le catalogue
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const status = statusLabels[order.status] ?? statusLabels.pending;
                return (
                  <div key={order.id} className="rounded-xl bg-card p-5 shadow-soft">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-muted-foreground">{order.order_number}</span>
                        <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(order.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {(order as any).order_items?.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.products?.name ?? "Produit"} × {item.quantity}
                          </span>
                          <span className="font-medium tabular-nums">
                            {formatPrice(Number(item.total_price))}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <span className="text-xs text-muted-foreground">{order.currency_code} · {order.payment_method ?? "—"}</span>
                      <span className="font-bold tabular-nums text-foreground">
                        {formatPrice(Number(order.total_amount))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StoreLayout>
  );
};

export default AccountPage;
