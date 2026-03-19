// ======================================================
// Fichier     : src/hooks/useStore.tsx
// Projet      : Bulonet 🚀
// Description : Contexte global du store (panier, devises,
//               marchés, conversion). Gère la persistance,
//               la synchronisation avec Supabase, la validation
//               des stocks, et le formatage des prix.
// ======================================================

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ====================================================
// 1. TYPES
// ====================================================

export interface CartItem {
  productId: string;
  name: string;
  imageUrl: string | null;
  basePriceUsd: number;
  quantity: number;
  variantId?: string;          // Si variante sélectionnée
  variantName?: string;         // Nom de la variante (ex: "Taille M")
  maxStock?: number;            // Stock maximum connu au moment de l'ajout
}

export interface Currency {
  code: string;                 // Code ISO (USD, EUR, ...)
  name: string;                 // Nom complet
  symbol: string;               // Symbole ($, €, ...)
  exchange_rate_to_usd: number; // Taux de conversion
  is_active: boolean;
  decimal_digits?: number;      // Nombre de décimales (par défaut 2)
}

export interface Market {
  id: string;
  name: string;
  country_code: string;         // Code ISO du pays (FR, US, ...)
  flag_emoji: string | null;
  default_language: string;     // Langue par défaut (fr, en, ...)
  currency_code: string;        // Devise locale par défaut
  is_active: boolean;
}

export interface ProductStock {
  id: string;
  stock_quantity: number;
}

// ====================================================
// 2. CONFIGURATION
// ====================================================

const CART_STORAGE_KEY = "bulonet-cart-v2";   // Versionnage pour éviter les incompatibilités
const DEFAULT_CURRENCY: Currency = {
  code: "USD",
  name: "Dollar",
  symbol: "$",
  exchange_rate_to_usd: 1,
  is_active: true,
  decimal_digits: 2,
};

// ====================================================
// 3. CONTEXTE
// ====================================================

interface StoreContextType {
  // Panier
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  clearCart: () => void;
  cartCount: number;
  cartTotalUsd: number;

  // Devises
  currency: Currency;
  setCurrencyCode: (code: string) => void;
  currencies: Currency[];
  convertPrice: (usdPrice: number) => number;
  formatPrice: (usdPrice: number) => string;

  // Marchés
  market: Market | null;
  setMarketByCountryCode: (code: string) => void;
  markets: Market[];
  detectUserMarket: () => Promise<void>; // Détection automatique (IP)

  // Utilitaires
  refreshRates: () => Promise<void>;
  validateCartStock: () => Promise<void>; // Vérifie les stocks et ajuste
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// ====================================================
// 4. PROVIDER PRINCIPAL
// ====================================================

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  // ---------- État local ----------
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validation basique : doit être un tableau
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // Ignorer les erreurs de parsing
    }
    return [];
  });

  const [currencyCode, setCurrencyCode] = useState<string>("USD");
  const [marketCode, setMarketCode] = useState<string>("FR"); // Par défaut France

  // ---------- Persistance du panier ----------
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // ---------- Requêtes Supabase ----------
  const { data: currencies = [], refetch: refetchCurrencies } = useQuery<Currency[]>({
    queryKey: ["store-currencies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("currencies")
        .select("*")
        .eq("is_active", true)
        .order("code");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 60, // 1 heure
    gcTime: 1000 * 60 * 60 * 24, // 24h
  });

  const { data: markets = [], refetch: refetchMarkets } = useQuery<Market[]>({
    queryKey: ["store-markets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("markets")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24h (rarement modifié)
  });

  // ---------- Sélection de la devise et du marché ----------
  const currency = useMemo(
    () => currencies.find((c) => c.code === currencyCode) ?? DEFAULT_CURRENCY,
    [currencies, currencyCode]
  );

  const market = useMemo(
    () => markets.find((m) => m.country_code === marketCode) ?? null,
    [markets, marketCode]
  );

  // ---------- Mise à jour du marché (par exemple après détection IP) ----------
  const setMarketByCountryCode = useCallback(
    (code: string) => {
      const found = markets.find((m) => m.country_code === code);
      if (found) {
        setMarketCode(code);
        // Optionnel : changer automatiquement la devise
        if (found.currency_code && found.currency_code !== currencyCode) {
          setCurrencyCode(found.currency_code);
        }
      }
    },
    [markets, currencyCode]
  );

  // ---------- Détection du marché via IP (appel à une API externe) ----------
  const detectUserMarket = useCallback(async () => {
    try {
      // Appel à une API gratuite (ex: ipapi.co) – à configurer
      const response = await fetch("https://ipapi.co/json/");
      if (!response.ok) return;
      const data = await response.json();
      const countryCode = data.country_code; // ex: "FR"
      if (countryCode) {
        setMarketByCountryCode(countryCode);
      }
    } catch (error) {
      console.error("Erreur lors de la détection du marché :", error);
    }
  }, [setMarketByCountryCode]);

  // ---------- Fonctions de conversion et formatage ----------
  const convertPrice = useCallback(
    (usdPrice: number) => usdPrice * currency.exchange_rate_to_usd,
    [currency]
  );

  const formatPrice = useCallback(
    (usdPrice: number) => {
      const converted = convertPrice(usdPrice);
      // Utiliser Intl.NumberFormat pour un formatage localisé
      const locale = market?.default_language?.replace("_", "-") ?? "fr-FR";
      const digits = currency.decimal_digits ?? 2;

      // Pour les très grandes valeurs, on peut arrondir
      const formatted = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency.code,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(converted);

      return formatted;
    },
    [convertPrice, currency, market]
  );

  // ---------- Gestion du panier avec validation de stock ----------
  const addToCart = useCallback(
    async (item: Omit<CartItem, "quantity">, quantity: number = 1) => {
      // Vérifier le stock disponible
      const { data: product, error } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.productId)
        .single();

      if (error || !product) {
        toast.error("Produit introuvable");
        return;
      }

      const maxStock = product.stock_quantity;

      if (maxStock < quantity) {
        toast.error(`Stock insuffisant (${maxStock} disponible)`);
        return;
      }

      setCart((prev) => {
        const existing = prev.find(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );
        if (existing) {
          const newQty = existing.quantity + quantity;
          if (newQty > maxStock) {
            toast.error(`Stock maximum atteint (${maxStock})`);
            return prev;
          }
          return prev.map((i) =>
            i.productId === item.productId && i.variantId === item.variantId
              ? { ...i, quantity: newQty }
              : i
          );
        } else {
          return [...prev, { ...item, quantity, maxStock }];
        }
      });
    },
    []
  );

  const removeFromCart = useCallback((productId: string, variantId?: string) => {
    setCart((prev) =>
      prev.filter(
        (i) => !(i.productId === productId && i.variantId === variantId)
      )
    );
  }, []);

  const updateQuantity = useCallback(
    async (productId: string, quantity: number, variantId?: string) => {
      if (quantity <= 0) {
        removeFromCart(productId, variantId);
        return;
      }

      // Vérifier le stock
      const { data: product, error } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", productId)
        .single();

      if (error || !product) {
        toast.error("Produit introuvable");
        return;
      }

      const maxStock = product.stock_quantity;

      if (quantity > maxStock) {
        toast.error(`Stock maximum : ${maxStock}`);
        return;
      }

      setCart((prev) =>
        prev.map((i) =>
          i.productId === productId && i.variantId === variantId
            ? { ...i, quantity, maxStock }
            : i
        )
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => setCart([]), []);

  // ---------- Validation périodique des stocks ----------
  const validateCartStock = useCallback(async () => {
    if (cart.length === 0) return;

    // Récupérer les IDs uniques
    const productIds = [...new Set(cart.map((item) => item.productId))];

    const { data: products, error } = await supabase
      .from("products")
      .select("id, stock_quantity")
      .in("id", productIds);

    if (error) {
      console.error("Erreur validation stock :", error);
      return;
    }

    const stockMap = new Map(products.map((p) => [p.id, p.stock_quantity]));

    const updatedCart = cart
      .map((item) => {
        const currentStock = stockMap.get(item.productId);
        if (currentStock === undefined) {
          // Produit supprimé → retirer du panier
          return null;
        }
        if (item.quantity > currentStock) {
          // Ajuster la quantité au stock disponible
          toast.warning(`Stock réduit pour ${item.name} (${currentStock} dispo)`);
          return { ...item, quantity: currentStock, maxStock: currentStock };
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    setCart(updatedCart);
  }, [cart]);

  // Validation au montage et après chaque modification de panier ?
  useEffect(() => {
    validateCartStock();
  }, []); // Seulement au montage pour éviter trop d'appels

  // ---------- Calculs dérivés ----------
  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);
  const cartTotalUsd = useMemo(
    () => cart.reduce((sum, i) => sum + i.basePriceUsd * i.quantity, 0),
    [cart]
  );

  // ---------- Rafraîchissement manuel des taux ----------
  const refreshRates = useCallback(async () => {
    await refetchCurrencies();
    toast.success("Taux de change mis à jour");
  }, [refetchCurrencies]);

  // ---------- Valeur du contexte ----------
  const value: StoreContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartTotalUsd,

    currency,
    setCurrencyCode,
    currencies,
    convertPrice,
    formatPrice,

    market,
    setMarketByCountryCode,
    markets,
    detectUserMarket,

    refreshRates,
    validateCartStock,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

// ====================================================
// 5. HOOK D'UTILISATION
// ====================================================

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return ctx;
};

// ====================================================
// 💡 CONSEILS & ORIENTATIONS
// ====================================================
// - Ce fichier est le cœur du store client ; il doit être importé
//   dans App.tsx pour envelopper les routes.
// - Les fonctions `addToCart` et `updateQuantity` font désormais
//   une requête à Supabase pour vérifier le stock en temps réel.
//   Cela peut être optimisé par un cache React Query si nécessaire.
// - La détection du marché par IP utilise ipapi.co – vous pouvez
//   remplacer par un service auto-hébergé ou utiliser les headers
//   Cloudflare si disponible.
// - Le panier est persisté avec un versionnage (clé v2). En cas de
//   changement majeur de structure, pensez à migrer les anciennes données.
// - La validation périodique des stocks est lancée au montage. Vous
//   pouvez aussi l'appeler après un certain temps ou lors du retour
//   à l'application.
// - Les taux de change sont rafraîchis toutes les heures par défaut.
//   Vous pouvez ajouter un bouton manuel.
// - Pour les variantes, le stock est géré via la table `product_variants`.
//   Adaptez les requêtes en conséquence.
// - Pensez à configurer les politiques RLS dans Supabase pour que
//   les utilisateurs non connectés puissent lire les produits, devises, etc.
// ====================================================
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity } : i));
    }
  }, []);

  const clearCart = useCallback(() => setCart([]), []);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotalUsd = cart.reduce((sum, i) => sum + i.basePriceUsd * i.quantity, 0);

  return (
    <StoreContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart,
      cartCount, cartTotalUsd,
      currency, setCurrencyCode, currencies,
      market, setMarketCode: setMarketCode, markets,
      convertPrice, formatPrice,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
};
