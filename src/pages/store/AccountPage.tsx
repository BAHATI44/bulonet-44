// ======================================================
// Fichier     : src/pages/store/AccountPage.tsx
// Projet      : Bulonet 🚀
// Description : Page de compte utilisateur – affiche les commandes,
//               permet de gérer le profil, les adresses, les favoris,
//               et de modifier ses informations personnelles.
//               Intègre des appels API réels vers Supabase.
// ======================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import StoreLayout from "@/components/store/StoreLayout";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  User,
  Package,
  LogOut,
  Clock,
  ShoppingBag,
  MapPin,
  Heart,
  Settings,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Mail,
  Phone,
  Home,
  ChevronRight,
} from "lucide-react";

// ====================================================
// 1. TYPES ET SCHÉMAS
// ====================================================

// Schéma pour la mise à jour du profil
const profileSchema = z.object({
  full_name: z.string().min(2, "Nom trop court").max(100).optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional().nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Schéma pour une adresse
const addressSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nom requis"),
  address_line1: z.string().min(3, "Adresse requise"),
  address_line2: z.string().optional(),
  city: z.string().min(2, "Ville requise"),
  postal_code: z.string().optional(),
  country: z.string().min(2, "Pays requis"),
  is_default: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

// Statut des commandes (identique au code original)
const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  confirmed: { label: "Confirmée", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  processing: { label: "En cours", color: "bg-primary/10 text-primary border-primary/30" },
  shipped: { label: "Expédiée", color: "bg-violet-500/10 text-violet-600 border-violet-500/30" },
  delivered: { label: "Livrée", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  cancelled: { label: "Annulée", color: "bg-destructive/10 text-destructive border-destructive/30" },
  refunded: { label: "Remboursée", color: "bg-muted text-muted-foreground border-border" },
};

// ====================================================
// 2. FONCTIONS API (Supabase)
// ====================================================

// Récupérer le profil utilisateur
async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

// Mettre à jour le profil
async function updateProfile(userId: string, data: ProfileFormData) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...data, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// Récupérer les adresses
async function fetchAddresses(userId: string) {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false });
  if (error) throw error;
  return data;
}

// Ajouter / modifier une adresse
async function upsertAddress(address: AddressFormData & { user_id: string }) {
  const { error } = await supabase.from("addresses").upsert(address);
  if (error) throw error;
}

// Supprimer une adresse
async function deleteAddress(addressId: string) {
  const { error } = await supabase.from("addresses").delete().eq("id", addressId);
  if (error) throw error;
}

// Récupérer les favoris (wishlist)
async function fetchWishlist(userId: string) {
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("*, products(*)")
    .eq("user_id", userId);
  if (error) throw error;
  return data;
}

// Supprimer un favori
async function removeFromWishlist(itemId: string) {
  const { error } = await supabase.from("wishlist_items").delete().eq("id", itemId);
  if (error) throw error;
}

// ====================================================
// 3. SOUS-COMPOSANTS
// ====================================================

/**
 * 📦 Carte de commande (affichage d'une seule commande)
 */
const OrderCard = ({ order, formatPrice }: { order: any; formatPrice: (price: number) => string }) => {
  const [expanded, setExpanded] = useState(false);
  const status = statusLabels[order.status] ?? statusLabels.pending;

  return (
    <div className="rounded-xl bg-card p-5 shadow-soft">
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

      {/* Premiers articles (résumé) */}
      <div className="space-y-2">
        {(order.order_items?.slice(0, expanded ? undefined : 2) ?? []).map((item: any) => (
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

      {/* Bouton pour afficher plus d'articles */}
      {order.order_items?.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-primary hover:underline"
        >
          {expanded ? "Voir moins" : `Voir les ${order.order_items.length} articles`}
        </button>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">
          {order.currency_code} · {order.payment_method ?? "—"}
        </span>
        <span className="font-bold tabular-nums text-foreground">
          {formatPrice(Number(order.total_amount))}
        </span>
      </div>
    </div>
  );
};

/**
 * 🏠 Gestion des adresses
 */
const AddressManager = ({ userId }: { userId: string }) => {
  const queryClient = useQueryClient();
  const [editingAddress, setEditingAddress] = useState<AddressFormData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: addresses, isLoading } = useQuery({
    queryKey: ["addresses", userId],
    queryFn: () => fetchAddresses(userId),
  });

  const upsertMutation = useMutation({
    mutationFn: (address: AddressFormData & { user_id: string }) => upsertAddress(address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
      toast.success("Adresse enregistrée");
      setEditingAddress(null);
    },
    onError: (error) => toast.error("Erreur : " + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
      toast.success("Adresse supprimée");
      setDeletingId(null);
    },
  });

  const handleSubmit = (data: AddressFormData) => {
    upsertMutation.mutate({ ...data, user_id: userId });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Mes adresses</h3>
        <Dialog open={!!editingAddress} onOpenChange={(open) => !open && setEditingAddress(null)}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAddress?.id ? "Modifier" : "Nouvelle"} adresse</DialogTitle>
            </DialogHeader>
            <AddressForm
              initialData={editingAddress}
              onSubmit={handleSubmit}
              onCancel={() => setEditingAddress(null)}
              isPending={upsertMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : addresses?.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Aucune adresse enregistrée.</p>
      ) : (
        <div className="space-y-3">
          {addresses?.map((addr) => (
            <div key={addr.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{addr.name}</p>
                  <p className="text-sm text-muted-foreground">{addr.address_line1}</p>
                  {addr.address_line2 && (
                    <p className="text-sm text-muted-foreground">{addr.address_line2}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {addr.postal_code} {addr.city}, {addr.country}
                  </p>
                  {addr.is_default && (
                    <Badge variant="outline" className="mt-2 text-xs bg-primary/5">
                      Par défaut
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingAddress(addr)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setDeletingId(addr.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'adresse ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/**
 * 📝 Formulaire d'adresse (utilisé dans le dialog)
 */
const AddressForm = ({
  initialData,
  onSubmit,
  onCancel,
  isPending,
}: {
  initialData: AddressFormData | null;
  onSubmit: (data: AddressFormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialData || {
      name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      postal_code: "",
      country: "",
      is_default: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom / Destinataire</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="address_line1">Adresse</Label>
        <Input id="address_line1" {...register("address_line1")} />
        {errors.address_line1 && <p className="text-xs text-destructive">{errors.address_line1.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="address_line2">Complément (optionnel)</Label>
        <Input id="address_line2" {...register("address_line2")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="postal_code">Code postal</Label>
          <Input id="postal_code" {...register("postal_code")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Ville</Label>
          <Input id="city" {...register("city")} />
          {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="country">Pays</Label>
        <Input id="country" {...register("country")} />
        {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="is_default" {...register("is_default")} />
        <Label htmlFor="is_default">Définir comme adresse par défaut</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
};

/**
 * ❤️ Gestion des favoris
 */
const WishlistManager = ({ userId }: { userId: string }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: wishlist, isLoading } = useQuery({
    queryKey: ["wishlist", userId],
    queryFn: () => fetchWishlist(userId),
  });

  const removeMutation = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist", userId] });
      toast.success("Retiré des favoris");
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!wishlist?.length) {
    return (
      <div className="text-center py-12">
        <Heart className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <p className="mt-2 text-muted-foreground">Aucun favori pour le moment.</p>
        <Button className="mt-4" onClick={() => navigate("/store")}>
          Découvrir le catalogue
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {wishlist.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/50"
          onClick={() => navigate(`/store/product/${item.product_id}`)}
        >
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
            {item.products?.image_url ? (
              <img src={item.products.image_url} alt={item.products.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Package className="h-6 w-6" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.products?.name}</p>
            <p className="text-xs text-muted-foreground">
              {item.products?.base_price} {item.products?.currency || "USD"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              removeMutation.mutate(item.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
};

/**
 * 👤 Édition du profil
 */
const ProfileEditor = ({ userId, initialData }: { userId: string; initialData: any }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialData?.full_name || "",
      phone: initialData?.phone || "",
      avatar_url: initialData?.avatar_url || "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ProfileFormData) => updateProfile(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      toast.success("Profil mis à jour");
    },
  });

  const onSubmit = (data: ProfileFormData) => mutation.mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nom complet</Label>
        <Input id="full_name" {...register("full_name")} />
        {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" {...register("phone")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="avatar_url">URL de l'avatar</Label>
        <Input id="avatar_url" {...register("avatar_url")} />
      </div>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mettre à jour"}
      </Button>
    </form>
  );
};

// ====================================================
// 4. COMPOSANT PRINCIPAL
// ====================================================

const AccountPage = () => {
  const { user, signOut, loading } = useAuth();
  const { formatPrice } = useStore();
  const navigate = useNavigate();

  // Redirection si non connecté
  useEffect(() => {
    if (!loading && !user) navigate("/store/auth");
  }, [loading, user, navigate]);

  // Requête des commandes
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: async () => {
      const { data, erro                      </div>
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
