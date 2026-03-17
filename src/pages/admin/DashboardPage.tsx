import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Package, Globe, Coins, ShoppingCart, TrendingUp, TrendingDown } from "lucide-react";

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: { value: string; positive: boolean };
}) => (
  <div className="rounded-lg bg-card p-5 shadow-soft">
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{title}</p>
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
    </div>
    <p className="mt-2 text-2xl font-bold tabular-nums text-card-foreground">{value}</p>
    {trend && (
      <div className="mt-1 flex items-center gap-1 text-xs">
        {trend.positive ? (
          <TrendingUp className="h-3 w-3 text-success" />
        ) : (
          <TrendingDown className="h-3 w-3 text-destructive" />
        )}
        <span className={trend.positive ? "text-success" : "text-destructive"}>
          {trend.value}
        </span>
        <span className="text-muted-foreground">vs mois dernier</span>
      </div>
    )}
  </div>
);

const DashboardPage = () => {
  const { data: productCount } = useQuery({
    queryKey: ["admin-product-count"],
    queryFn: async () => {
      const { count } = await supabase.from("products").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: marketCount } = useQuery({
    queryKey: ["admin-market-count"],
    queryFn: async () => {
      const { count } = await supabase.from("markets").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: currencyCount } = useQuery({
    queryKey: ["admin-currency-count"],
    queryFn: async () => {
      const { count } = await supabase.from("currencies").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: orderCount } = useQuery({
    queryKey: ["admin-order-count"],
    queryFn: async () => {
      const { count } = await supabase.from("orders").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  return (
    <AdminLayout title="Tableau de bord">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Produits" value={String(productCount ?? 0)} icon={Package} trend={{ value: "+12%", positive: true }} />
        <StatCard title="Marchés actifs" value={String(marketCount ?? 0)} icon={Globe} />
        <StatCard title="Devises" value={String(currencyCount ?? 0)} icon={Coins} />
        <StatCard title="Commandes" value={String(orderCount ?? 0)} icon={ShoppingCart} trend={{ value: "+8%", positive: true }} />
      </div>

      <div className="mt-8 rounded-lg bg-card p-6 shadow-soft">
        <h2 className="mb-4 text-lg font-semibold text-card-foreground">Commandes récentes</h2>
        {recentOrders && recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 font-medium">N° Commande</th>
                  <th className="pb-3 font-medium">Statut</th>
                  <th className="pb-3 font-medium text-right">Montant</th>
                  <th className="pb-3 font-medium">Devise</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="py-3 font-mono text-xs">{order.order_number}</td>
                    <td className="py-3">
                      <span className="rounded-sm bg-secondary px-2 py-0.5 text-xs font-medium capitalize text-secondary-foreground">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-right tabular-nums">{Number(order.total_amount).toFixed(2)}</td>
                    <td className="py-3 font-mono text-xs">{order.currency_code}</td>
                    <td className="py-3 text-muted-foreground">{new Date(order.created_at).toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune commande pour le moment.</p>
        )}
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
