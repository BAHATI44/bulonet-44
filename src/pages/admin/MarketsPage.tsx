import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const MarketsPage = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", country_code: "", flag_emoji: "", default_language: "fr", is_active: true });

  const { data: markets, isLoading } = useQuery({
    queryKey: ["admin-markets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("markets").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = { ...form };
      if (editId) {
        const { error } = await supabase.from("markets").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("markets").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-markets"] });
      toast.success(editId ? "Marché modifié" : "Marché créé");
      resetForm();
    },
    onError: () => toast.error("Erreur"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("markets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-markets"] });
      toast.success("Marché supprimé");
    },
  });

  const resetForm = () => {
    setForm({ name: "", country_code: "", flag_emoji: "", default_language: "fr", is_active: true });
    setEditId(null);
    setOpen(false);
  };

  const startEdit = (m: NonNullable<typeof markets>[number]) => {
    setForm({
      name: m.name,
      country_code: m.country_code,
      flag_emoji: m.flag_emoji ?? "",
      default_language: m.default_language,
      is_active: m.is_active,
    });
    setEditId(m.id);
    setOpen(true);
  };

  return (
    <AdminLayout title="Marchés">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{markets?.length ?? 0} marché(s)</p>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Ajouter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Modifier le marché" : "Nouveau marché"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); upsert.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Nom du marché</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sénégal" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code pays</Label>
                  <Input value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })} placeholder="SN" maxLength={2} required />
                </div>
                <div className="space-y-2">
                  <Label>Emoji drapeau</Label>
                  <Input value={form.flag_emoji} onChange={(e) => setForm({ ...form, flag_emoji: e.target.value })} placeholder="🇸🇳" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Langue par défaut</Label>
                <Input value={form.default_language} onChange={(e) => setForm({ ...form, default_language: e.target.value })} placeholder="fr" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Actif</Label>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {markets?.map((m) => (
            <div key={m.id} className="rounded-lg bg-card p-5 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{m.flag_emoji}</span>
                  <div>
                    <p className="font-semibold text-card-foreground">{m.name}</p>
                    <p className="text-xs font-mono text-muted-foreground">{m.country_code} · {m.default_language}</p>
                  </div>
                </div>
                <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${m.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                  {m.is_active ? "Actif" : "Inactif"}
                </span>
              </div>
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => startEdit(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(m.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </div>
          ))}
          {markets?.length === 0 && (
            <p className="col-span-full py-8 text-center text-muted-foreground">Aucun marché configuré</p>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default MarketsPage;
