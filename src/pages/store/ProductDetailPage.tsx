import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StoreLayout from "@/components/store/StoreLayout";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, Package, Truck, Shield } from "lucide-react";
import { toast } from "sonner";

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatPrice, addToCart } = useStore();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleAdd = () => {
    if (!product) return;
    addToCart({
      productId: product.id,
      name: product.name,
      imageUrl: product.image_url,
      basePriceUsd: Number(product.base_price),
    });
    toast.success(`${product.name} ajouté au panier`);
  };

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </StoreLayout>
    );
  }

  if (!product) {
    return (
      <StoreLayout>
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Produit introuvable</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/store")}>
            Retour au catalogue
          </Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Back */}
        <button
          onClick={() => navigate("/store")}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au catalogue
        </button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="aspect-square overflow-hidden rounded-xl bg-secondary shadow-soft">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Package className="h-20 w-20" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {product.sku && (
              <p className="mb-2 text-xs font-mono text-muted-foreground">SKU: {product.sku}</p>
            )}
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{product.name}</h1>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold tabular-nums text-primary">
                {formatPrice(Number(product.base_price))}
              </span>
            </div>

            {/* Stock */}
            <div className="mt-4">
              {product.stock_quantity > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  En stock ({product.stock_quantity})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                  Rupture de stock
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-semibold text-foreground">Description</h2>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="mt-8 flex gap-3">
              <Button
                size="lg"
                className="flex-1 gap-2"
                onClick={handleAdd}
                disabled={product.stock_quantity === 0}
              >
                <ShoppingCart className="h-5 w-5" />
                Ajouter au panier
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  handleAdd();
                  navigate("/store/cart");
                }}
                disabled={product.stock_quantity === 0}
              >
                Acheter maintenant
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 grid grid-cols-3 gap-4 rounded-lg bg-secondary/50 p-4">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <Truck className="h-5 w-5 text-primary" />
                <span className="text-[10px] font-medium text-muted-foreground">Livraison internationale</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-[10px] font-medium text-muted-foreground">Paiement sécurisé</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <Package className="h-5 w-5 text-primary" />
                <span className="text-[10px] font-medium text-muted-foreground">Retour 30 jours</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
};

export default ProductDetailPage;
