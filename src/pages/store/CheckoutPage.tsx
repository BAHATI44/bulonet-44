import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StoreLayout from "@/components/store/StoreLayout";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, CreditCard, Smartphone, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import SecurityBadge from "@/components/landing/SecurityBadge";

const paymentMethods: Record<string, { label: string; icon: React.ElementType; methods: string[] }> = {
  SN: { label: "Paiement mobile", icon: Smartphone, methods: ["Orange Money", "Wave"] },
  KE: { label: "Paiement mobile", icon: Smartphone, methods: ["M-Pesa", "Airtel Money"] },
  CI: { label: "Paiement mobile", icon: Smartphone, methods: ["MTN Money", "Orange Money"] },
  CM: { label: "Paiement mobile", icon: Smartphone, methods: ["MTN MoMo", "Orange Money"] },
  CD: { label: "Paiement mobile", icon: Smartphone, methods: ["M-Pesa", "Airtel Money", "Orange Money"] },
  RW: { label: "Paiement mobile", icon: Smartphone, methods: ["MTN MoMo", "Airtel Money"] },
  TZ: { label: "Paiement mobile", icon: Smartphone, methods: ["M-Pesa", "Airtel Money", "Tigo Pesa"] },
  EG: { label: "Paiement mobile", icon: Smartphone, methods: ["Vodafone Cash", "Fawry"] },
  ZA: { label: "Carte bancaire", icon: CreditCard, methods: ["Visa", "Mastercard", "SnapScan"] },
  MA: { label: "Paiement mobile", icon: Smartphone, methods: ["CashPlus", "Inwi Money", "Visa"] },
  SA: { label: "Carte bancaire", icon: CreditCard, methods: ["Visa", "Mastercard", "Mada", "Apple Pay"] },
  CN: { label: "Paiement mobile", icon: Smartphone, methods: ["Alipay", "WeChat Pay", "UnionPay"] },
  BR: { label: "Carte bancaire", icon: CreditCard, methods: ["Pix", "Visa", "Mastercard"] },
  IT: { label: "Carte bancaire", icon: CreditCard, methods: ["Visa", "Mastercard", "PayPal"] },
  CA: { label: "Carte bancaire", icon: CreditCard, methods: ["Visa", "Mastercard", "Interac"] },
  US: { label: "Carte bancaire", icon: CreditCard, methods: ["Visa", "Mastercard", "Apple Pay", "PayPal"] },
  FR: { label: "Carte bancaire", icon: CreditCard, methods: ["Visa", "Mastercard", "PayPal"] },
  GB: { label: "Carte bancaire", icon: CreditCard, methods: ["Visa", "Mastercard", "Apple Pay"] },
};

const CheckoutPage = () => {
  const { cart, cartTotalUsd, formatPrice, currency, market, clearCart } = useStore();
  const navigate = useNavigate();
  const [selectedPayment, setSelectedPayment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", address: "", city: "", phone: "" });

  const marketPayments = paymentMethods[market?.country_code ?? "FR"] ?? paymentMethods.FR;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) {
      toast.error("Veuillez sélectionner un moyen de paiement");
      return;
    }
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 2000));
    setIsProcessing(false);
    setIsComplete(true);
    clearCart();
  };

  if (isComplete) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-lg px-6 py-20 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Commande confirmée</h1>
          <p className="mt-2 text-muted-foreground">
            Votre paiement de {formatPrice(cartTotalUsd)} via {selectedPayment} a été traité avec succès.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Un email de confirmation vous sera envoyé.</p>
          <Button className="mt-8" onClick={() => navigate("/store")}>
            Continuer vos achats
          </Button>
        </div>
      </StoreLayout>
    );
  }

  if (cart.length === 0) {
    navigate("/store/cart");
    return null;
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
          <SecurityBadge />
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-5">
          {/* Left: Form */}
          <div className="space-y-6 lg:col-span-3">
            {/* Shipping */}
            <div className="rounded-lg bg-card p-6 shadow-soft">
              <h2 className="mb-4 text-base font-semibold text-card-foreground">Adresse de livraison</h2>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nom complet</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Ville</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-lg bg-card p-6 shadow-soft">
              <h2 className="mb-1 text-base font-semibold text-card-foreground">
                Moyen de paiement
              </h2>
              <p className="mb-4 text-xs text-muted-foreground flex items-center gap-1.5">
                <marketPayments.icon className="h-3.5 w-3.5" />
                {market?.flag_emoji} {market?.name ?? "International"} — {marketPayments.label}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {marketPayments.methods.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedPayment(method)}
                    className={`rounded-md border px-4 py-3 text-left text-sm font-medium transition-all ${
                      selectedPayment === method
                        ? "border-primary bg-primary/5 text-primary shadow-soft"
                        : "border-border text-card-foreground hover:bg-secondary"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 rounded-lg bg-card p-6 shadow-soft">
              <h2 className="mb-4 text-base font-semibold text-card-foreground">Résumé</h2>
              <div className="space-y-3 mb-4">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate mr-2">
                      {item.name} <span className="text-xs">×{item.quantity}</span>
                    </span>
                    <span className="shrink-0 tabular-nums font-medium">{formatPrice(item.basePriceUsd * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-border pt-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Livraison</span>
                  <span>Gratuite</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-xl font-bold tabular-nums text-foreground">{formatPrice(cartTotalUsd)}</span>
                </div>
                <p className="mt-1 text-right text-[10px] font-mono text-muted-foreground">
                  {currency.code}
                </p>
              </div>
              <Button type="submit" size="lg" className="mt-6 w-full gap-2" disabled={isProcessing}>
                <Lock className="h-4 w-4" />
                {isProcessing ? "Vérification du paiement..." : `Payer ${formatPrice(cartTotalUsd)}`}
              </Button>
              <p className="mt-3 text-center text-[10px] text-muted-foreground">
                Paiement sécurisé · Chiffrement E2E · PCI-DSS
              </p>
            </div>
          </div>
        </form>
      </div>
    </StoreLayout>
  );
};

export default CheckoutPage;
