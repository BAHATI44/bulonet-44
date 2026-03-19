// ======================================================
// Fichier     : src/pages/store/ProductDetailPage.tsx
// Projet      : Bulonet 🚀
// Description : Page détail d’un produit – affiche toutes les informations,
//               permet l’ajout au panier, propose des produits similaires,
//               gère les variantes, les avis, et le SEO.
//               Intègre des fonctionnalités avancées : galerie d’images,
//               sélecteur de quantité, recommandations IA, etc.
// ======================================================

import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StoreLayout from "@/components/store/StoreLayout";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  ArrowLeft,
  Package,
  Truck,
  Shield,
  Heart,
  Share2,
  ZoomIn,
  Star,
  Minus,
  Plus,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import ProductCard from "@/components/store/StoreProductCard"; // réutilisation

// ====================================================
// 🧩 TYPES (à déplacer dans un fichier partagé si nécessaire)
// ====================================================
interface Product {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  stock_quantity: number;
  sku: string | null;
  category: string | null;
  specifications: Record<string, any> | null; // JSON
  images: string[] | null; // URLs supplémentaires
  is_active: boolean;
  created_at: string;
  // ... autres champs
}

interface ProductVariant {
  id: string;
  product_id: string;
  name: string; // ex: "Taille M", "Couleur Rouge"
  price_modifier: number; // différence de prix (peut être négative)
  stock_quantity: number;
  attributes: Record<string, string>; // ex: { size: "M", color: "Rouge" }
}

// ====================================================
// 🧠 HOOK PERSONNALISÉ POUR LA PAGE PRODUIT
// ====================================================
const useProductDetail = (productId: string | undefined) => {
  const queryClient = useQueryClient();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Requête produit principal
  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useQuery<Product>({
    queryKey: ["product", productId],
    queryFn: async () => {
      if (!productId) throw new Error("ID produit manquant");
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 5, // 5 min
  });

  // Requête variantes (si existantes)
  const { data: variants = [] } = useQuery<ProductVariant[]>({
    queryKey: ["product-variants", productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
  });

  // Requête produits similaires (même catégorie, hors produit courant)
  const { data: similarProducts = [] } = useQuery<Product[]>({
    queryKey: ["similar-products", product?.category, productId],
    queryFn: async () => {
      if (!product?.category) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", product.category)
        .eq("is_active", true)
        .neq("id", product.id)
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!product?.category,
  });

  // Gestion de la quantité
  const maxStock = useMemo(() => {
    if (selectedVariant) return selectedVariant.stock_quantity;
    return product?.stock_quantity || 0;
  }, [product, selectedVariant]);

  const incrementQuantity = () => setQuantity((q) => Math.min(q + 1, maxStock));
  const decrementQuantity = () => setQuantity((q) => Math.max(q - 1, 1));

  // Réinitialiser la quantité quand le variant change
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant]);

  // Image sélectionnée (par défaut la première de la galerie ou l'image principale)
  useEffect(() => {
    if (product?.images && product.images.length > 0) {
      setSelectedImage(product.images[0]);
    } else if (product?.image_url) {
      setSelectedImage(product.image_url);
    }
  }, [product]);

  return {
    product,
    variants,
    similarProducts,
    isLoading,
    error,
    refetch,
    selectedVariant,
    setSelectedVariant,
    quantity,
    setQuantity,
    incrementQuantity,
    decrementQuantity,
    maxStock,
    selectedImage,
    setSelectedImage,
  };
};

// ====================================================
// 🧩 SOUS-COMPOSANTS
// ====================================================

/**
 * 🖼️ Galerie d'images (avec zoom)
 */
const ImageGallery = ({
  images,
  selectedImage,
  onSelect,
}: {
  images: string[];
  selectedImage: string | null;
  onSelect: (url: string) => void;
}) => {
  if (!selectedImage) return null;

  return (
    <div className="space-y-4">
      {/* Image principale avec zoom au clic */}
      <Dialog>
        <DialogTrigger asChild>
          <div className="relative aspect-square cursor-zoom-in overflow-hidden rounded-xl bg-secondary">
            <img
              src={selectedImage}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-2 right-2 rounded-full bg-background/80 p-2 backdrop-blur-sm">
              <ZoomIn className="h-5 w-5" />
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0">
          <div className="relative aspect-square w-full">
            <img
              src={selectedImage}
              alt=""
              className="h-full w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Miniatures */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(img)}
              className={`aspect-square overflow-hidden rounded-md border-2 transition-all ${
                selectedImage === img
                  ? "border-primary"
                  : "border-transparent hover:border-primary/50"
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * 📊 Sélecteur de variantes
 */
const VariantSelector = ({
  variants,
  selectedVariant,
  onChange,
}: {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onChange: (variant: ProductVariant) => void;
}) => {
  if (variants.length === 0) return null;

  // Regrouper par attribut (ex: taille, couleur)
  // Pour simplifier, on suppose que tous les variants ont les mêmes clés
  const attributeKeys = Object.keys(variants[0]?.attributes || {});

  return (
    <div className="space-y-4">
      {attributeKeys.map((key) => {
        const options = variants.map((v) => ({
          value: v.attributes[key],
          variant: v,
        }));
        // Supprimer les doublons
        const uniqueOptions = options.filter(
          (opt, idx, self) => self.findIndex((o) => o.value === opt.value) === idx
        );

        return (
          <div key={key}>
            <p className="mb-2 text-sm font-medium capitalize">{key}</p>
            <div className="flex flex-wrap gap-2">
              {uniqueOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={
                    selectedVariant?.attributes[key] === opt.value
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => onChange(opt.variant)}
                  disabled={opt.variant.stock_quantity === 0}
                >
                  {opt.value}
                </Button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * ⭐ Avis clients (simulés, à remplacer par des données réelles)
 */
const ReviewsSection = ({ productId }: { productId: string }) => {
  // Simulons quelques avis
  const reviews = [
    { id: 1, author: "Jean", rating: 5, comment: "Excellent produit, livraison rapide.", date: "2025-02-10" },
    { id: 2, author: "Marie", rating: 4, comment: "Bonne qualité, mais un peu cher.", date: "2025-02-05" },
  ];

  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.round(averageRating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">({reviews.length} avis)</span>
      </div>
      <Separator />
      {reviews.map((review) => (
        <div key={review.id} className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{review.author}</span>
            <div className="flex">
              {Array.from({ length: review.rating }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{review.date}</span>
          </div>
          <p className="text-sm text-muted-foreground">{review.comment}</p>
        </div>
      ))}
    </div>
  );
};

/**
 * 🧾 Spécifications produit
 */
const SpecificationsSection = ({ specs }: { specs: Record<string, any> | null }) => {
  if (!specs || Object.keys(specs).length === 0) return null;

  return (
    <div className="space-y-2">
      {Object.entries(specs).map(([key, value]) => (
        <div key={key} className="grid grid-cols-3 gap-2 text-sm">
          <span className="font-medium capitalize">{key}</span>
          <span className="col-span-2 text-muted-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
};

// ====================================================
// 🏠 COMPOSANT PRINCIPAL
// ====================================================
const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatPrice, addToCart } = useStore();

  // Hook personnalisé
  const {
    product,
    variants,
    similarProducts,
    isLoading,
    error,
    refetch,
    selectedVariant,
    setSelectedVariant,
    quantity,
    incrementQuantity,
    decrementQuantity,
    maxStock,
    selectedImage,
    setSelectedImage,
  } = useProductDetail(id);

  // Récupérer toutes les images disponibles
  const allImages = useMemo(() => {
    const imgs = [];
    if (product?.image_url) imgs.push(product.image_url);
    if (product?.images) imgs.push(...product.images);
    return imgs;
  }, [product]);

  // Gestion de l'ajout au panier
  const handleAddToCart = () => {
    if (!product) return;
    const finalPrice = selectedVariant
      ? product.base_price + (selectedVariant.price_modifier || 0)
      : product.base_price;
    addToCart({
      productId: product.id,
      name: product.name,
      imageUrl: product.image_url,
      basePriceUsd: finalPrice,
      quantity,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
    });
    toast.success(`${product.name} ajouté au panier (${quantity}x)`);
  };

  // Gestion de l'achat immédiat
  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/store/cart");
  };

  // Ajouter aux favoris (localStorage)
  const [wishlist, setWishlist] = useLocalStorage<string[]>("wishlist", []);
  const isInWishlist = product ? wishlist.includes(product.id) : false;
  const toggleWishlist = () => {
    if (!product) return;
    if (isInWishlist) {
      setWishlist(wishlist.filter((pid) => pid !== product.id));
      toast.info(`${product.name} retiré des favoris`);
    } else {
      setWishlist([...wishlist, product.id]);
      toast.success(`${product.name} ajouté aux favoris`);
    }
  };

  // Partage
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description || "",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié dans le presse-papier");
    }
  };

  // Gestion d'erreur
  if (error) {
    return (
      <StoreLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-destructive">Erreur lors du chargement du produit</p>
          <Button onClick={() => refetch()} variant="outline" className="mt-4">
            Réessayer
          </Button>
        </div>
      </StoreLayout>
    );
  }

  // États de chargement
  if (isLoading || !product) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Skeleton className="mb-6 h-6 w-32" />
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-24 w-full" />
              <div className="flex gap-3">
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 w-32" />
              </div>
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      {/* 🧠 SEO */}
      <Helmet>
        <title>{product.name} - Bulonet</title>
        <meta name="description" content={product.description || "Fiche produit"} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description || ""} />
        {product.image_url && <meta property="og:image" content={product.image_url} />}
      </Helmet>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Fil d'Ariane */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <button
            onClick={() => navigate("/store")}
            className="hover:text-foreground transition-colors"
          >
            Catalogue
          </button>
          <ChevronRight className="h-4 w-4" />
          {product.category && (
            <>
              <span className="capitalize">{product.category}</span>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
          <span className="font-medium text-foreground truncate max-w-xs">
            {product.name}
          </span>
        </nav>

        {/* Ligne supérieure avec actions */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/store")}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={toggleWishlist}>
                    <Heart
                      className={`h-5 w-5 ${
                        isInWishlist ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isInWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleShare}>
                    <Share2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Partager</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Grille principale */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Galerie */}
          <ImageGallery
            images={allImages}
            selectedImage={selectedImage}
            onSelect={setSelectedImage}
          />

          {/* Infos produit */}
          <div className="flex flex-col">
            {/* SKU et catégorie */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {product.sku && <span className="font-mono">SKU: {product.sku}</span>}
              {product.category && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="capitalize">
                    {product.category}
                  </Badge>
                </>
              )}
            </div>

            <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              {product.name}
            </h1>

            {/* Prix */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold tabular-nums text-primary">
                {formatPrice(
                  selectedVariant
                    ? product.base_price + selectedVariant.price_modifier
                    : product.base_price
                )}
              </span>
              {selectedVariant && selectedVariant.price_modifier !== 0 && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.base_price)}
                </span>
              )}
            </div>

            {/* Variantes */}
            {variants.length > 0 && (
              <div className="mt-6">
                <VariantSelector
                  variants={variants}
                  selectedVariant={selectedVariant}
                  onChange={setSelectedVariant}
                />
              </div>
            )}

            {/* Stock */}
            <div className="mt-4">
              {maxStock > 0 ? (
                <div className="flex items              ) : (
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
