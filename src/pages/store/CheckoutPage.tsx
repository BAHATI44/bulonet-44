import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StoreLayout from "@/components/store/StoreLayout";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Smartphone, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CheckoutPage = () => {
  const { cart, cartTotalUsd, formatPrice, currency, market, clearCart } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [form, setForm] = useState({ name: "", email: user?.email || "", phone: "", address: "", city: "", country: market?.name || "" });

  if (cart.length === 0) {
    return (
      <StoreLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">Votre panier est vide</p>
          <Button className="mt-4" onClick={() => navigate("/store")}>Continuer les achats</Button>
        </div>
      </StoreLayout>
    );
  }

  const paymentMethods = market?.country_code === "CD" ? ["M-Pesa", "Airtel Money", "Orange Money"]
    : market?.country_code === "RW" ? ["MTN MoMo", "Airtel Money"]
    : market?.country_code === "BR" ? ["Pix", "Visa", "Mastercard"]
    : ["Visa", "Mastercard", "PayPal"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) { toast.error("Sélectionnez un moyen de paiement"); return; }
    if (!user) { toast.error("Connectez-vous pour passer commande"); navigate("/store/auth"); return; }

    setIsProcessing(true);
    try {
      const { data: order, error: orderError } = await supabase.from("orders").insert({
        user_id: user.id,
        total_amount: cartTotalUsd,
        currency_code: currency.code,
        order_number: `BUL-${Date.now()}`,
        payment_method: selectedPayment,
        market_id: market?.id || null,
        shipping_address: { name: form.name, address: form.address, city: form.city, country: form.country, phone: form.phone },
      }).select().single();

      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.basePriceUsd,
        total_price: item.basePriceUsd * item.quantity,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      clearCart();
      toast.success("Commande passée avec succès !");
      navigate("/store/account");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la commande");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <StoreLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="mb-8 text-2xl font-bold text-foreground">Finaliser la commande</h1>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            {/* Shipping */}
            <div className="rounded-lg bg-card p-6 shadow-soft space-y-4">
              <h2 className="text-base font-semibold text-card-foreground">Adresse de livraison</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label>Nom complet</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Téléphone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>Pays</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Adresse</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Ville</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></div>
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-lg bg-card p-6 shadow-soft space-y-4">
              <h2 className="text-base font-semibold text-card-foreground">Moyen de paiement</h2>
              <p className="text-xs text-muted-foreground">{market?.flag_emoji} {market?.name ?? "International"}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {paymentMethods.map((method) => (
                  <button key={method} type="button" onClick={() => setSelectedPayment(method)}
                    className={`rounded-md border px-4 py-3 text-left text-sm font-medium transition-all ${selectedPayment === method ? "border-primary bg-primary/5 text-primary shadow-soft" : "border-border text-card-foreground hover:bg-secondary"}`}>
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 rounded-lg bg-card p-6 shadow-soft">
              <h2 className="mb-4 text-base font-semibold text-card-foreground">Résumé</h2>
              <div className="space-y-3 mb-4">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate mr-2">{item.name} <span className="text-xs">×{item.quantity}</span></span>
                    <span className="shrink-0 tabular-nums font-medium">{formatPrice(item.basePriceUsd * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-border pt-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground"><span>Livraison</span><span>Gratuite</span></div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-xl font-bold tabular-nums text-foreground">{formatPrice(cartTotalUsd)}</span>
                </div>
              </div>
              <Button type="submit" size="lg" className="mt-6 w-full gap-2" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {isProcessing ? "Traitement..." : `Payer ${formatPrice(cartTotalUsd)}`}
              </Button>
              <p className="mt-3 text-center text-[10px] text-muted-foreground">Paiement sécurisé · Chiffrement E2E</p>
            </div>
          </div>
        </form>
      </div>
    </StoreLayout>
  );
};

export default CheckoutPage;
