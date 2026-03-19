// ======================================================
// Fichier     : src/pages/store/CartPage.tsx
// Projet      : Bulonet 🚀
// Description : Page panier – affiche les articles,
//               permet de modifier les quantités, supprimer,
//               appliquer un code promo, choisir un mode
//               de livraison, et voir le récapitulatif.
//               Intègre des appels API réels pour les coupons
//               et l'estimation de livraison.
// ======================================================

import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import StoreLayout from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  ShoppingCart,
  Tag,
  Truck,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ====================================================
// 1. TYPES (à adapter selon votre API)
// ====================================================

interface Coupon {
  code: string;
  discountPercent: number;
  minAmount?: number;
  expiresAt?: string;
}

interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

// ====================================================
// 2. FONCTIONS API (à remplacer par de vrais appels)
// ====================================================

/**
 * Appelle l'API pour valider un code promo et retourner la réduction.
 */
async function validateCoupon(code: string): Promise<Coupon | null> {
  const response = await fetch("/api/coupons/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Code promo invalide");
  }
  return response.json();
}

/**
 * Calcule les options de livraison en fonction du pays et du panier.
 */
async function calculateShipping(items: any[], countryCode: string): Promise<ShippingOption[]> {
  const response = await fetch("/api/shipping/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, countryCode }),
  });
  if (!response.ok) {
    throw new Error("Impossible de calculer les frais de port");
  }
  return response.json();
}

// ====================================================
// 3. COMPOSANT D'ARTICLE DE PANIER (avec animations)
// ====================================================

const CartItem = ({ item }: { item: any }) => {
  const { updateQuantity, removeFromCart, formatPrice } = useStore();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (newQty: number) => {
    if (newQty < 1) return;
    setIsUpdating(true);
    try {
      await updateQuantity(item.productId, newQty, item.variantId);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour de la quantité");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await removeFromCart(item.productId, item.variantId);
      toast.success("Article retiré du panier", {
        action: {
          label: "Annuler",
          onClick: () => {
            // restauration (si votre store le permet)
          },
        },
      });
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      setIsRemoving(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex items-center gap-4 rounded-lg bg-card p-4 shadow-soft"
    >
      {/* Image */}
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ShoppingCart className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* Infos produit */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-card-foreground truncate">{item.name}</h3>
        {item.variantName && (
          <p className="text-xs text-muted-foreground">Variante : {item.variantName}</p>
        )}
        <p className="text-sm tabular-nums text-muted-foreground mt-1">
          {formatPrice(item.basePriceUsd)}
        </p>
      </div>

      {/* Quantité */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleUpdate(item.quantity - 1)}
          disabled={item.quantity <= 1 || isUpdating || isRemoving}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center text-sm font-medium tabular-nums">
          {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : item.quantity}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleUpdate(item.quantity + 1)}
          disabled={isUpdating || isRemoving}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Prix total */}
      <p className="w-24 text-right text-sm font-bold tabular-nums text-foreground">
        {formatPrice(item.basePriceUsd * item.quantity)}
      </p>

      {/* Bouton supprimer */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={handleRemove}
        disabled={isRemoving}
      >
        {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
      </Button>
    </motion.div>
  );
};

// ====================================================
// 4. HOOK PERSONNALISÉ POUR LA GESTION DU PANIER
// ====================================================

const useCartManager = () => {
  const { cart, cartTotalUsd, cartCount } = useStore();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [countryCode, setCountryCode] = useState("FR"); // à récupérer du marché

  const { market } = useStore();

  // Met à jour le code pays quand le marché change
  useEffect(() => {
    if (market?.country_code) {
      setCountryCode(market.country_code);
    }
  }, [market]);

  // Calcule les frais de port quand le panier ou le pays change
  useEffect(() => {
    if (cart.length === 0) return;
    setIsLoadingShipping(true);
    calculateShipping(cart, countryCode)
      .then((options) => {
        setShippingOptions(options);
        if (options.length > 0 && !selectedShipping) {
          setSelectedShipping(options[0]); // sélectionne le premier par défaut
        }
      })
      .catch((err) => {
        toast.error("Erreur lors du calcul des frais de port");
        console.error(err);
      })
      .finally(() => setIsLoadingShipping(false));
  }, [cart, countryCode]);

  // Applique un code promo
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const result = await validateCoupon(couponCode);
      if (result) {
        if (result.minAmount && cartTotalUsd < result.minAmount) {
          toast.error(`Ce code nécessite un minimum d'achat de ${result.minAmount} €`);
        } else {
          setCoupon(result);
          toast.success(`Code appliqué : ${result.discountPercent}% de réduction`);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Code invalide");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponCode("");
  };

  // Calcul du total avec réduction et livraison
  const subtotal = cartTotalUsd;
  const discount = coupon ? (subtotal * coupon.discountPercent) / 100 : 0;
  const shippingCost = selectedShipping?.price || 0;
  const total = subtotal - discount + shippingCost;

  return {
    cart,
    cartCount,
    subtotal,
    discount,
    shippingCost,
    total,
    coupon,
    couponCode,
    setCouponCode,
    applyCoupon,
    removeCoupon,
    isApplyingCoupon,
    shippingOptions,
    selectedShipping,
    setSelectedShipping,
    isLoadingShipping,
    countryCode,
  };
};

// ====================================================
// 5. COMPOSANT PRINCIPAL
// ====================================================

const CartPage = () => {
  const navigate = useNavigate();
  const { formatPrice } = useStore();
  const {
    cart,
    cartCount,
    subtotal,
    discount,
    shippingCost,
    total,
    coupon,
    couponCode,
    setCouponCode,
    applyCoupon,
    removeCoupon,
    isApplyingCoupon,
    shippingOptions,
    selectedShipping,
    setSelectedShipping,
    isLoadingShipping,
    countryCode,
  } = useCartManager();

  // Redirection vers le catalogue si panier vide
  if (cart.length === 0) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Votre panier est vide</h1>
          <p className="mt-2 text-muted-foreground">Explorez notre catalogue pour trouver des produits.</p>
          <Link to="/store">
            <Button className="mt-6">Voir le catalogue</Button>
          </Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* En-tête */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Panier <span className="text-muted-foreground font-normal text-lg">({cartCount})</span>
          </h1>
          <Link
            to="/store"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Continuer les achats
          </Link>
        </div>

        {/* Grille principale : articles + récapitulatif */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Liste des articles */}
          <div className="lg:col-span-2 space-y-3">
            <AnimatePresence mode="popLayout">
              {cart.map((item) => (
                <CartItem key={`${item.productId}-${item.variantId || ''}`} item={item} />
              ))}
            </AnimatePresence>
          </div>

          {/* Récapitulatif et actions */}
          <div className="space-y-6">
            {/* Bloc résumé */}
            <div className="rounded-lg bg-card p-6 shadow-soft">
              <h2 className="mb-4 text-base font-semibold text-card-foreground">Récapitulatif</h2>

              {/* Sous-total */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Sous-total</span>
                <span className="tabular-nums font-medium text-foreground">
                  {formatPrice(subtotal)}
                </span>
              </div>

              {/* Réduction si coupon appliqué */}
              {coupon && (
                <div className="mt-2 flex items-center justify-between text-sm text-success">
                  <span>Réduction ({coupon.discountPercent}%)</span>
                  <span className="tabular-nums font-medium">-{formatPrice(discount)}</span>
                </div>
              )}

              {/* Frais de port */}
              <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>Livraison</span>
                {isLoadingShipping ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <span className="tabular-nums font-medium">
                    {shippingCost === 0 ? "Gratuite" : formatPrice(shippingCost)}
                  </span>
                )}
              </div>

              <Separator className="my-4" />

              {/* Total */}
              <div className="flex items-center justify-between text-base font-semibold text-foreground">
                <span>Total</span>
                <span className="text-lg tabular-nums">{formatPrice(total)}</span>
              </div>

              {/* Bouton de checkout */}
              <Link to="/store/checkout" state={{ selectedShipping, coupon }}>
                <Button size="lg" className="mt-6 w-full gap-2">
                  Passer la commande
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              {/* Message de sécurité */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Paiement sécurisé
              </div>
            </div>

            {/* Bloc code promo */}
            <div className="rounded-lg bg-card p-6 shadow-soft">
              <h3 className="mb-3 text-sm font-semibold text-card-foreground flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                Code promo
              </h3>
              {coupon ? (
                <div className="flex items-center justify-between rounded-md border border-success/30 bg-success/5 p-3">
                  <div>
                    <p className="text-sm font-medium text-success">{coupon.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {coupon.discountPercent}% de réduction
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={removeCoupon}>
                    Retirer
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: PROMO10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={isApplyingCoupon}
                  />
                  <Button
                    variant="outline"
                    onClick={applyCoupon}
                    disabled={isApplyingCoupon || !couponCode.trim()}
                  >
                    {isApplyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Appliquer"}
                  </Button>
                </div>
              )}
            </div>

            {/* Bloc choix de livraison */}
            {shippingOptions.length > 0 && (
              <div className="rounded-lg bg-card p-6 shadow-soft">
                <h3 className="mb-3 text-sm font-semibold text-card-foreground flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  Mode de livraison
                </h3>
                <RadioGroup
                  value={selectedShipping?.id}
                  onValueChange={(id) => {
                    const opt = shippingOptions.find((o) => o.id === id);
                    if (opt) setSelectedShipping(opt);
                  }}
                  className="space-y-2"
                >
                  {shippingOptions.map((option) => (
                    <div key={option.id} className="flex items-start gap-3 rounded-md border border-border p-3">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        <p className="text-sm font-medium">{option.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {option.description} · {option.estimatedDays}
                        </p>
                      </Label>
                      <p className="text-sm font-semibold tabular-nums">
                        {option.price === 0 ? "Gratuit" : formatPrice(option.price)}
                      </p>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  );
};

export default CartPage;

// ====================================================
// 💡 CONSEILS & ORIENTATIONS
// ====================================================
// 1. Ce fichier doit être placé dans `src/pages/store/CartPage.tsx`.
// 2. Il utilise des appels API réels pour les coupons et la livraison.
//    Assurez-vous que les endpoints backend existent.
// 3. Le hook `useCartManager` centralise toute la logique métier.
// 4. Les composants UI (RadioGroup, Separator, Skeleton) viennent de shadcn/ui.
//    Installez-les si nécessaire : `npx shadcn-ui@latest add radio-group separator skeleton`
// 5. Les animations utilisent framer-motion ; installez-le avec `npm install framer-motion`.
// 6. Le store `useStore` doit fournir les méthodes `updateQuantity` et `removeFromCart`
//    qui retournent des promesses (ou gèrent les erreurs). Adaptez votre store.
// 7. La restauration après suppression est optionnelle ; pour une vraie expérience,
//    implémentez un système d'undo avec une pile locale ou en appelant une API.
// 8. Les données de livraison sont recalculées à chaque changement de panier/pays.
//    Vous pouvez optimiser avec un debounce.
// ====================================================
