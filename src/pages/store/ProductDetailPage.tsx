import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StoreLayout from "@/components/store/StoreLayout";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, Package, Truck, Shield, Heart, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatPrice, addToCart } = useStore();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleAdd = () => {
    if (!product) return;
    addToCart({ productId: product.id, name: product.name, imageUrl: product.image_url, basePriceUsd: Number(product.base_price) }, quantity);
    toast.success(`${product.name} ajouté au panier`);
  };

  const handleWishlist = async () => {
    if (!user) { toast.error("Connectez-vous pour ajouter aux favoris"); navigate("/store/auth"); return; }
    if (!product) return;
    const { error } = await (supabase.from("wishlist_items" as any) as any).upsert({ user_id: user.id, product_id: product.id }, { onConflict: "user_id,product_id" });
    if (error) toast.error("Erreur lors de l'ajout aux favoris");
    else toast.success("Ajouté aux favoris ❤️");
  };

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/4" /><Skeleton className="h-24 w-full" /><Skeleton className="h-12 w-full" /></div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!product) {
    return (
      <StoreLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">Produit introuvable</p>
          <Button onClick={() => navigate("/store")} variant="outline" className="mt-4">Retour au catalogue</Button>
        </div>
      </StoreLayout>
    );
  }

  const maxStock = product.stock_quantity;

  return (
    <StoreLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Button variant="ghost" size="sm" className="mb-6 gap-1.5" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-xl bg-secondary">
            {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><Package className="h-16 w-16" /></div>}
          </div>
          <div className="flex flex-col">
            {product.sku && <p className="text-xs font-mono text-muted-foreground mb-2">SKU: {product.sku}</p>}
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{product.name}</h1>
            <p className="mt-3 text-3xl font-bold text-primary tabular-nums">{formatPrice(Number(product.base_price))}</p>
            <div className="mt-4">
              {maxStock > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
                  {maxStock <= 10 ? `Plus que ${maxStock} en stock` : "En stock"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">Rupture de stock</span>
              )}
            </div>
            {product.description && (
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-semibold text-foreground">Description</h2>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{product.description}</p>
              </div>
            )}
            {maxStock > 0 && (
              <div className="mt-6 flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">Quantité</span>
                <div className="flex items-center rounded-lg border border-border">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 text-muted-foreground hover:text-foreground"><Minus className="h-4 w-4" /></button>
                  <span className="px-4 py-2 text-sm font-medium tabular-nums">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(maxStock, quantity + 1))} className="px-3 py-2 text-muted-foreground hover:text-foreground"><Plus className="h-4 w-4" /></button>
                </div>
              </div>
            )}
            <div className="mt-8 flex gap-3">
              <Button size="lg" className="flex-1 gap-2" onClick={handleAdd} disabled={maxStock === 0}><ShoppingCart className="h-5 w-5" /> Ajouter au panier</Button>
              <Button size="lg" variant="outline" onClick={handleWishlist}><Heart className="h-5 w-5" /></Button>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 rounded-lg bg-secondary/50 p-4">
              <div className="flex flex-col items-center gap-1.5 text-center"><Truck className="h-5 w-5 text-primary" /><span className="text-[10px] font-medium text-muted-foreground">Livraison internationale</span></div>
              <div className="flex flex-col items-center gap-1.5 text-center"><Shield className="h-5 w-5 text-primary" /><span className="text-[10px] font-medium text-muted-foreground">Paiement sécurisé</span></div>
              <div className="flex flex-col items-center gap-1.5 text-center"><Package className="h-5 w-5 text-primary" /><span className="text-[10px] font-medium text-muted-foreground">Retour 30 jours</span></div>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
};

export default ProductDetailPage;
