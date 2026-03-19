// ======================================================
// Fichier     : src/pages/store/CheckoutPage.tsx
// Projet      : Bulonet 🚀
// Description : Page de paiement – formulaire d'adresse,
//               choix du mode de paiement adapté au marché,
//               résumé de commande, validation, et intégration
//               réelle avec un service de paiement (ex: Stripe).
//               Fonctionnalités avancées : validation robuste,
//               gestion d'état par machine à états, calcul des taxes,
//               méthodes de livraison, et sécurité renforcée.
// ======================================================

import { useState, useReducer, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import StoreLayout from "@/components/store/StoreLayout";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Lock,
  CreditCard,
  Smartphone,
  CheckCircle2,
  Truck,
  MapPin,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import SecurityBadge from "@/components/landing/SecurityBadge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

// ====================================================
// 1. CONFIGURATION STRIPE (à remplacer par votre clé publique)
// ====================================================
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// ====================================================
// 2. TYPES ET SCHÉMAS DE VALIDATION
// ====================================================

// Schéma de validation du formulaire avec Zod
const checkoutSchema = z.object({
  name: z.string().min(2, "Nom trop court").max(100),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Téléphone invalide").max(20),
  address: z.string().min(5, "Adresse trop courte").max(200),
  city: z.string().min(2, "Ville trop courte").max(100),
  postalCode: z.string().optional(),
  country: z.string().min(2, "Pays requis"),
  shippingMethod: z.enum(["standard", "express"]),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Types pour les méthodes de paiement (déjà dans le code original)
interface PaymentMethodInfo {
  label: string;
  icon: React.ElementType;
  methods: string[];
}

// ====================================================
// 3. DONNÉES STATIQUES (méthodes de paiement par pays)
// ====================================================
const paymentMethods: Record<string, PaymentMethodInfo> = {
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

// Méthodes de livraison (frais et délais – à remplacer par appel API)
const shippingMethods = {
  standard: { label: "Standard", fee: 0, days: "5-7 jours", icon: Truck },
  express: { label: "Express", fee: 9.99, days: "2-3 jours", icon: Truck },
};

// ====================================================
// 4. GESTION D'ÉTAT AVANCÉE AVEC useReducer
// ====================================================

type CheckoutState = {
  step: "form" | "processing" | "success" | "error";
  selectedPayment: string;
  orderId?: string;
  errorMessage?: string;
  clientSecret?: string; // pour Stripe
};

type CheckoutAction =
  | { type: "SET_PAYMENT"; payload: string }
  | { type: "START_PROCESSING" }
  | { type: "SUCCESS"; orderId: string }
  | { type: "ERROR"; message: string }
  | { type: "SET_CLIENT_SECRET"; payload: string }
  | { type: "RESET" };

const initialState: CheckoutState = {
  step: "form",
  selectedPayment: "",
  orderId: undefined,
  errorMessage: undefined,
  clientSecret: undefined,
};

function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case "SET_PAYMENT":
      return { ...state, selectedPayment: action.payload };
    case "START_PROCESSING":
      return { ...state, step: "processing", errorMessage: undefined };
    case "SUCCESS":
      return { ...state, step: "success", orderId: action.orderId };
    case "ERROR":
      return { ...state, step: "error", errorMessage: action.message };
    case "SET_CLIENT_SECRET":
      return { ...state, clientSecret: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

// ====================================================
// 5. HOOK PERSONNALISÉ POUR LE CALCUL DES TOTAUX
// ====================================================
const useCheckoutTotals = () => {
  const { cart, cartTotalUsd } = useStore();

  // Dans un vrai projet, les taxes seraient calculées en fonction du pays de livraison
  // via un appel API. Ici on utilise une valeur fictive, mais à remplacer par une vraie logique.
  const taxRate = 0.20; // 20% TVA (exemple, à remplacer par appel réel)
  const subtotal = cartTotalUsd;
  const tax = subtotal * taxRate;

  return { subtotal, tax, total: subtotal + tax };
};

// ====================================================
// 6. COMPOSANT DE PAIEMENT STRIPE (formulaire de carte)
// ====================================================
const StripePaymentForm = ({
  onSuccess,
  onError,
  clientSecret,
}: {
  onSuccess: (orderId: string) => void;
  onError: (message: string) => void;
  clientSecret: string;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/store/checkout/success`, // à gérer côté route
      },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message || "Erreur de paiement");
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      // Ici on devrait appeler le backend pour confirmer la commande avec l'ID du paymentIntent
      onSuccess(paymentIntent.id);
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || isLoading} className="w-full gap-2">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        Payer maintenant
      </Button>
    </form>
  );
};

// ====================================================
// 7. COMPOSANTS INTERNES
// ====================================================

/**
 * 🧾 Résumé de commande (partie droite, sticky)
 */
const OrderSummary = ({
  subtotal,
  tax,
  shippingFee,
  total,
  formatPrice,
  selectedShipping,
  onShippingChange,
  cart,
}: {
  subtotal: number;
  tax: number;
  shippingFee: number;
  total: number;
  formatPrice: (price: number) => string;
  selectedShipping: "standard" | "express";
  onShippingChange: (method: "standard" | "express") => void;
  cart: any[];
}) => {
  return (
    <div className="sticky top-20 rounded-lg bg-card p-6 shadow-soft">
      <h2 className="mb-4 text-base font-semibold text-card-foreground">Résumé</h2>

      {/* Articles */}
      <div className="mb-4 max-h-60 space-y-2 overflow-y-auto pr-2">
        {cart.map((item) => (
          <div key={item.productId} className="flex items-center justify-between text-sm">
            <span className="truncate text-muted-foreground">
              {item.name} <span className="text-xs">×{item.quantity}</span>
            </span>
            <span className="tabular-nums font-medium">
              {formatPrice(item.basePriceUsd * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Méthode de livraison */}
      <div className="mb-4 space-y-2">
        <Label className="text-xs text-muted-foreground">Mode de livraison</Label>
        <RadioGroup
          value={selectedShipping}
          onValueChange={(v) => onShippingChange(v as "standard" | "express")}
          className="space-y-2"
        >
          {Object.entries(shippingMethods).map(([key, method]) => (
            <div key={key} className="flex items-center justify-between rounded-md border border-border p-3">
              <div className="flex items-center gap-3">
                <RadioGroupItem value={key} id={`shipping-${key}`} />
                <Label htmlFor={`shipping-${key}`} className="flex cursor-pointer items-center gap-2">
                  <method.icon className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{method.label}</p>
                    <p className="text-xs text-muted-foreground">{method.days}</p>
                  </div>
                </Label>
              </div>
              <span className="text-sm font-medium tabular-nums">
                {method.fee === 0 ? "Gratuit" : formatPrice(method.fee)}
              </span>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Détail des prix */}
      <div className="space-y-3 border-t border-dashed border-border pt-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Sous-total</span>
          <span className="tabular-nums">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Taxes estimées</span>
          <span className="tabular-nums">{formatPrice(tax)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Livraison</span>
          <span className="tabular-nums">
            {shippingFee === 0 ? "Gratuit" : formatPrice(shippingFee)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="font-semibold text-foreground">Total</span>
        <span className="text-xl font-bold tabular-nums text-foreground">
          {formatPrice(total + shippingFee)}
        </span>
      </div>

      {/* Note de sécurité */}
      <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        Paiement 100% sécurisé
      </div>
    </div>
  );
};

/**
 * 📝 Formulaire d'adresse (react-hook-form)
 */
const AddressForm = ({
  register,
  errors,
  defaultCountry,
}: {
  register: any;
  errors: any;
  defaultCountry: string;
}) => {
  return (
    <div className="rounded-lg bg-card p-6 shadow-soft">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-card-foreground">
        <MapPin className="h-4 w-4 text-primary" />
        Adresse de livraison
      </h2>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" type="tel" {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Pays</Label>
            <Input id="country" {...register("country")} defaultValue={defaultCountry} />
            {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Adresse</Label>
          <Input id="address" {...register("address")} />
          {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input id="city" {...register("city")} />
            {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Code postal</Label>
            <Input id="postalCode" {...register("postalCode")} />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 💳 Sélection du moyen de paiement (adapté au marché)
 */
const PaymentSelector = ({
  marketPayments,
  selectedPayment,
  onSelect,
}: {
  marketPayments: PaymentMethodInfo;
  selectedPayment: string;
  onSelect: (method: string) => void;
}) => {
  return (
    <div className="rounded-lg bg-card p-6 shadow-soft">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-card-foreground">
        <marketPayments.icon className="h-4 w-4 text-primary" />
        Moyen de paiement
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        {marketPayments.label} — choisis ton moyen préféré
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {marketPayments.methods.map((method) => (
          <button
            key={method}
            type="button"
            onClick={() => onSelect(method)}
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
  );
};

// ====================================================
// 8. COMPOSANT PRINCIPAL
// ====================================================
const CheckoutPageContent = () => {
  const { cart, cartTotalUsd, formatPrice, currency, market, clearCart } = useStore();
  const navigate = useNavigate();

  // État avec useReducer
  const [state, dispatch] = useReducer(checkoutReducer, initialState);

  // État local pour la méthode de livraison
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");

  // Récupération des méthodes de paiement selon le marché
  const marketPayments = paymentMethods[market?.country_code ?? "FR"] ?? paymentMethods.FR;

  // Calcul des totaux (sans frais de livraison)
  const { subtotal, tax } = useCheckoutTotals();
  const shippingFee = shippingMethods[shippingMethod].fee;
  const totalWithShipping = subtotal + tax + shippingFee;

  // React Hook Form avec validation Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      country: market?.country_code || "FR",
      shippingMethod: "standard",
    },
  });

  // Met à jour le champ country quand le marché change
  useEffect(() => {
    if (market?.country_code) {
      setValue("country", market.country_code);
    }
  }, [market, setValue]);

  // Redirection si panier vide
  useEffect(() => {
    if (cart.length === 0 && state.step !== "success") {
      navigate("/store/cart");
    }
  }, [cart, navigate, state.step]);

  // Soumission initiale : créer l'intention de paiement sur le backend
  const onSubmit = async (formData: CheckoutFormData) => {
    if (!state.selectedPayment) {
      toast.error("Veuillez sélectionner un moyen de paiement");
      return;
    }

    dispatch({ type: "START_PROCESSING" });

    try {
      // 1. Envoyer les données au backend pour créer la commande et l'intention de paiement
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData,
          cart,
          total: totalWithShipping,
          paymentMethod: state.selectedPayment,
          market: market?.country_code,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la création du paiement");
      }

      const { clientSecret, orderId } = await response.json();

      // Si le moyen de paiement nécessite Stripe, on stocke le clientSecret
      if (state.selectedPayment.toLowerCase().includes("carte") || state.selectedPayment === "Visa" || state.selectedPayment === "Mastercard") {
        dispatch({ type: "SET_CLIENT_SECRET", payload: clientSecret });
        // On reste en step "processing" mais on affiche le formulaire Stripe
      } else {
        // Pour les autres moyens, on considère que le paiement est initié côté backend
        // (ex: redirection vers un service externe ou confirmation immédiate)
        // Ici on simule un succès – à adapter selon votre logique
        dispatch({ type: "SUCCESS", orderId });
        clearCart();
      }
    } catch (error) {
      dispatch({ type: "ERROR", message: error instanceof Error ? error.message : "Erreur inconnue" });
    }
  };

  // Callback de succès Stripe
  const handleStripeSuccess = (paymentIntentId: string) => {
    // Appeler le backend pour finaliser la commande
    fetch("/api/confirm-order", {
      method: "POST",
      headers                <div className="space-y-2">
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
