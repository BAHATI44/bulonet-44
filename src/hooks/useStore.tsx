import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CartItem {
  productId: string;
  name: string;
  imageUrl: string | null;
  basePriceUsd: number;
  quantity: number;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_usd: number;
  is_active: boolean;
}

export interface Market {
  id: string;
  name: string;
  country_code: string;
  flag_emoji: string | null;
  default_language: string;
  is_active: boolean;
}

const CART_STORAGE_KEY = "bulonet-cart-v2";
const DEFAULT_CURRENCY: Currency = { code: "USD", name: "Dollar", symbol: "$", exchange_rate_to_usd: 1, is_active: true };

interface StoreContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotalUsd: number;
  currency: Currency;
  setCurrencyCode: (code: string) => void;
  currencies: Currency[];
  market: Market | null;
  setMarketCode: (code: string) => void;
  markets: Market[];
  convertPrice: (usdPrice: number) => number;
  formatPrice: (usdPrice: number) => string;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [marketCode, setMarketCode] = useState("FR");

  useEffect(() => { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); }, [cart]);

  const { data: currencies = [] } = useQuery<Currency[]>({
    queryKey: ["store-currencies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("currencies").select("*").eq("is_active", true).order("code");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: markets = [] } = useQuery<Market[]>({
    queryKey: ["store-markets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("markets").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  const currency = useMemo(() => currencies.find((c) => c.code === currencyCode) ?? DEFAULT_CURRENCY, [currencies, currencyCode]);
  const market = useMemo(() => markets.find((m) => m.country_code === marketCode) ?? null, [markets, marketCode]);

  const convertPrice = useCallback((usdPrice: number) => usdPrice * currency.exchange_rate_to_usd, [currency]);
  const formatPrice = useCallback((usdPrice: number) => {
    const converted = convertPrice(usdPrice);
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency.code, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(converted);
  }, [convertPrice, currency]);

  const addToCart = useCallback((item: Omit<CartItem, "quantity">, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) => i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

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
      market, setMarketCode, markets,
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
