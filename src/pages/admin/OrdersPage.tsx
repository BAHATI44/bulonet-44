import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-primary/10 text-primary",
  processing: "bg-primary/10 text-primary",
  shipped: "bg-primary/10 text-primary",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En cours",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

const OrdersPage = () => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminLayout title="Commandes">
      <p className="mb-6 text-sm text-muted-foreground">{orders?.length ?? 0} commande(s)</p>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : (
        <div className="rounded-lg bg-card shadow-soft overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-4 font-medium">N° Commande</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium text-right">Montant</th>
                <th className="p-4 font-medium">Devise</th>
                <th className="p-4 font-medium">Paiement</th>
                <th className="p-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0">
                  <td className="p-4 font-mono text-xs font-medium text-card-foreground">{o.order_number}</td>
                  <td className="p-4">
                    <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${statusColors[o.status] ?? "bg-muted text-muted-foreground"}`}>
                      {statusLabels[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="p-4 text-right tabular-nums font-mono">{Number(o.total_amount).toFixed(2)}</td>
                  <td className="p-4 font-mono text-xs">{o.currency_code}</td>
                  <td className="p-4 text-muted-foreground">{o.payment_method ?? "—"}</td>
                  <td className="p-4 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
              {orders?.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Aucune commande</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default OrdersPage;
