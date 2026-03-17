import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CartItem {
  productId: string;
  name: string;
  imageUrl: string | null;
  basePriceUsd: number;
  quantity: number;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_usd: number;
}

interface Market {
  id: string;
  name: string;
  country_code: string;
  flag_emoji: string | null;
  default_language: string;
}

interface StoreContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
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

const defaultCurrency: Currency = { code: "USD", name: "Dollar", symbol: "$", exchange_rate_to_usd: 1 };

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("bulonet-cart");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [marketCode, setMarketCode] = useState("FR");

  useEffect(() => {
    localStorage.setItem("bulonet-cart", JSON.stringify(cart));
  }, [cart]);

  const { data: currencies = [] } = useQuery({
    queryKey: ["store-currencies"],
    queryFn: async () => {
      const { data } = await supabase.from("currencies").select("*").eq("is_active", true).order("code");
      return (data ?? []) as Currency[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: markets = [] } = useQuery({
    queryKey: ["store-markets"],
    queryFn: async () => {
      const { data } = await supabase.from("markets").select("*").eq("is_active", true).order("name");
      return (data ?? []) as Market[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const currency = currencies.find((c) => c.code === currencyCode) ?? defaultCurrency;
  const market = markets.find((m) => m.country_code === marketCode) ?? null;

  const convertPrice = useCallback((usdPrice: number) => usdPrice * currency.exchange_rate_to_usd, [currency]);

  const formatPrice = useCallback(
    (usdPrice: number) => {
      const converted = convertPrice(usdPrice);
      if (currency.exchange_rate_to_usd > 10) {
        return `${Math.round(converted).toLocaleString("fr-FR")} ${currency.symbol}`;
      }
      return `${currency.symbol}${converted.toFixed(2)}`;
    },
    [convertPrice, currency]
  );

  const addToCart = useCallback((item: Omit<CartItem, "quantity">) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
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
