import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const CurrenciesPage = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", name: "", symbol: "", exchange_rate_to_usd: "1.0" });

  const { data: currencies, isLoading } = useQuery({
    queryKey: ["admin-currencies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("currencies").select("*").order("code");
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code.toUpperCase(),
        name: form.name,
        symbol: form.symbol,
        exchange_rate_to_usd: Number(form.exchange_rate_to_usd),
      };
      if (editId) {
        const { error } = await supabase.from("currencies").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("currencies").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-currencies"] });
      toast.success(editId ? "Devise modifiée" : "Devise créée");
      resetForm();
    },
    onError: () => toast.error("Erreur"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("currencies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-currencies"] });
      toast.success("Devise supprimée");
    },
  });

  const resetForm = () => {
    setForm({ code: "", name: "", symbol: "", exchange_rate_to_usd: "1.0" });
    setEditId(null);
    setOpen(false);
  };

  const startEdit = (c: NonNullable<typeof currencies>[number]) => {
    setForm({
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      exchange_rate_to_usd: String(c.exchange_rate_to_usd),
    });
    setEditId(c.id);
    setOpen(true);
  };

  return (
    <AdminLayout title="Devises">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{currencies?.length ?? 0} devise(s)</p>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Ajouter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Modifier la devise" : "Nouvelle devise"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); upsert.mutate(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code (ISO)</Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="XOF" maxLength={3} required />
                </div>
                <div className="space-y-2">
                  <Label>Symbole</Label>
                  <Input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="CFA" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Franc CFA" required />
              </div>
              <div className="space-y-2">
                <Label>Taux de change (1 USD =)</Label>
                <Input type="number" step="0.000001" value={form.exchange_rate_to_usd} onChange={(e) => setForm({ ...form, exchange_rate_to_usd: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full" disabled={upsert.isPending}>
                {upsert.isPending ? "Enregistrement..." : editId ? "Modifier" : "Créer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : (
        <div className="rounded-lg bg-card shadow-soft overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-4 font-medium">Code</th>
                <th className="p-4 font-medium">Nom</th>
                <th className="p-4 font-medium">Symbole</th>
                <th className="p-4 font-medium text-right">1 USD =</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currencies?.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="p-4 font-mono font-semibold text-card-foreground">{c.code}</td>
                  <td className="p-4">{c.name}</td>
                  <td className="p-4">{c.symbol}</td>
                  <td className="p-4 text-right font-mono tabular-nums">{Number(c.exchange_rate_to_usd).toFixed(4)}</td>
                  <td className="p-4">
                    <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${c.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {currencies?.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Aucune devise configurée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default CurrenciesPage;
