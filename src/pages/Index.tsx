// ======================================================
// Fichier     : src/pages/Index.tsx
// Projet      : Bulonet 🚀
// Description : Page d'accueil du site – présente les fonctionnalités,
//               les marchés supportés, les taux de change, la sécurité,
//               et un appel à l'action. La liste des marchés a été étendue
//               pour couvrir 15+ pays par continent (Afrique, Europe, Asie,
//               Amérique, Océanie) avec leurs monnaies et langues.
// ======================================================

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Globe,
  Shield,
  CreditCard,
  BarChart3,
  Languages,
  Truck,
  Lock,
  ArrowRight,
  Zap,
  Menu,
  X,
  ChevronRight,
  Fingerprint,
  ShieldCheck,
  Eye,
  Server,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import SecurityBadge from "@/components/landing/SecurityBadge";
import MarketCard from "@/components/landing/MarketCard"; // Doit accepter une prop `language`
import FeatureCard from "@/components/landing/FeatureCard";
import ExchangeRateRow from "@/components/landing/ExchangeRateRow";
import heroGlobe from "@/assets/hero-globe.png";

// ====================================================
// 🌍 LISTE ÉTENDUE DES MARCHÉS (75+ pays)
// Structure : { flag, country, currency, currencyCode, language, payments }
// ====================================================
const markets = [
  // ----- Afrique (18 pays) -----
  { flag: "🇨🇩", country: "RD Congo", currency: "Franc congolais", currencyCode: "CDF", language: "Français", payments: ["M-Pesa", "Airtel Money", "Orange Money"] },
  { flag: "🇷🇼", country: "Rwanda", currency: "Franc rwandais", currencyCode: "RWF", language: "Kinyarwanda", payments: ["MTN MoMo", "Airtel Money"] },
  { flag: "🇲🇦", country: "Maroc", currency: "Dirham", currencyCode: "MAD", language: "Arabe", payments: ["CashPlus", "Inwi Money", "Visa"] },
  { flag: "🇿🇦", country: "Afrique du Sud", currency: "Rand", currencyCode: "ZAR", language: "Anglais", payments: ["SnapScan", "Visa", "Mastercard"] },
  { flag: "🇹🇿", country: "Tanzanie", currency: "Shilling", currencyCode: "TZS", language: "Swahili", payments: ["M-Pesa", "Airtel Money", "Tigo Pesa"] },
  { flag: "🇨🇮", country: "Côte d'Ivoire", currency: "Franc CFA", currencyCode: "XOF", language: "Français", payments: ["MTN Money", "Orange Money", "Moov"] },
  { flag: "🇪🇬", country: "Égypte", currency: "Livre égyptienne", currencyCode: "EGP", language: "Arabe", payments: ["Vodafone Cash", "Fawry"] },
  { flag: "🇳🇬", country: "Nigeria", currency: "Naira", currencyCode: "NGN", language: "Anglais", payments: ["Paystack", "Flutterwave", "Bank Transfer"] },
  { flag: "🇰🇪", country: "Kenya", currency: "Shilling kenyan", currencyCode: "KES", language: "Swahili", payments: ["M-Pesa", "Airtel Money"] },
  { flag: "🇬🇭", country: "Ghana", currency: "Cedi", currencyCode: "GHS", language: "Anglais", payments: ["MTN MoMo", "Vodafone Cash"] },
  { flag: "🇸🇳", country: "Sénégal", currency: "Franc CFA", currencyCode: "XOF", language: "Français", payments: ["Orange Money", "Wave"] },
  { flag: "🇨🇲", country: "Cameroun", currency: "Franc CFA", currencyCode: "XAF", language: "Français", payments: ["Orange Money", "MTN Money"] },
  { flag: "🇺🇬", country: "Ouganda", currency: "Shilling ougandais", currencyCode: "UGX", language: "Anglais", payments: ["M-Pesa", "Airtel Money"] },
  { flag: "🇿🇲", country: "Zambie", currency: "Kwacha", currencyCode: "ZMW", language: "Anglais", payments: ["MTN MoMo", "Airtel Money"] },
  { flag: "🇲🇿", country: "Mozambique", currency: "Metical", currencyCode: "MZN", language: "Portugais", payments: ["M-Pesa", "e-Mola"] },
  { flag: "🇦🇴", country: "Angola", currency: "Kwanza", currencyCode: "AOA", language: "Portugais", payments: ["Multicaixa", "Visa"] },
  { flag: "🇪🇹", country: "Éthiopie", currency: "Birr", currencyCode: "ETB", language: "Amharique", payments: ["TeleBirr", "CBE"] },
  { flag: "🇲🇬", country: "Madagascar", currency: "Ariary", currencyCode: "MGA", language: "Malgache", payments: ["MVola", "Airtel Money"] },

  // ----- Europe (18 pays) -----
  { flag: "🇫🇷", country: "France", currency: "Euro", currencyCode: "EUR", language: "Français", payments: ["Stripe", "PayPal", "Apple Pay"] },
  { flag: "🇬🇧", country: "Royaume-Uni", currency: "Livre Sterling", currencyCode: "GBP", language: "Anglais", payments: ["Stripe", "PayPal", "Google Pay"] },
  { flag: "🇮🇹", country: "Italie", currency: "Euro", currencyCode: "EUR", language: "Italien", payments: ["Visa", "Mastercard", "PayPal"] },
  { flag: "🇩🇪", country: "Allemagne", currency: "Euro", currencyCode: "EUR", language: "Allemand", payments: ["Giropay", "PayPal", "Visa"] },
  { flag: "🇪🇸", country: "Espagne", currency: "Euro", currencyCode: "EUR", language: "Espagnol", payments: ["Visa", "Mastercard", "PayPal"] },
  { flag: "🇵🇹", country: "Portugal", currency: "Euro", currencyCode: "EUR", language: "Portugais", payments: ["Multibanco", "PayPal"] },
  { flag: "🇳🇱", country: "Pays-Bas", currency: "Euro", currencyCode: "EUR", language: "Néerlandais", payments: ["iDEAL", "PayPal"] },
  { flag: "🇧🇪", country: "Belgique", currency: "Euro", currencyCode: "EUR", language: "Français/Néerlandais", payments: ["Bancontact", "PayPal"] },
  { flag: "🇨🇭", country: "Suisse", currency: "Franc suisse", currencyCode: "CHF", language: "Allemand/Français", payments: ["Twint", "Visa"] },
  { flag: "🇸🇪", country: "Suède", currency: "Couronne suédoise", currencyCode: "SEK", language: "Suédois", payments: ["Klarna", "Swish"] },
  { flag: "🇳🇴", country: "Norvège", currency: "Couronne norvégienne", currencyCode: "NOK", language: "Norvégien", payments: ["Vipps", "PayPal"] },
  { flag: "🇩🇰", country: "Danemark", currency: "Couronne danoise", currencyCode: "DKK", language: "Danois", payments: ["MobilePay", "Visa"] },
  { flag: "🇫🇮", country: "Finlande", currency: "Euro", currencyCode: "EUR", language: "Finnois", payments: ["Siirto", "PayPal"] },
  { flag: "🇵🇱", country: "Pologne", currency: "Złoty", currencyCode: "PLN", language: "Polonais", payments: ["Blik", "PayPal"] },
  { flag: "🇨🇿", country: "Tchéquie", currency: "Couronne tchèque", currencyCode: "CZK", language: "Tchèque", payments: ["GoPay", "Visa"] },
  { flag: "🇭🇺", country: "Hongrie", currency: "Forint", currencyCode: "HUF", language: "Hongrois", payments: ["SimplePay", "Mastercard"] },
  { flag: "🇦🇹", country: "Autriche", currency: "Euro", currencyCode: "EUR", language: "Allemand", payments: ["EPS", "PayPal"] },
  { flag: "🇮🇪", country: "Irlande", currency: "Euro", currencyCode: "EUR", language: "Anglais", payments: ["Stripe", "PayPal"] },

  // ----- Asie (18 pays) -----
  { flag: "🇨🇳", country: "Chine", currency: "Yuan", currencyCode: "CNY", language: "Chinois", payments: ["Alipay", "WeChat Pay", "UnionPay"] },
  { flag: "🇯🇵", country: "Japon", currency: "Yen", currencyCode: "JPY", language: "Japonais", payments: ["PayPay", "Visa", "Mastercard"] },
  { flag: "🇮🇳", country: "Inde", currency: "Roupie indienne", currencyCode: "INR", language: "Hindi", payments: ["Paytm", "PhonePe", "UPI"] },
  { flag: "🇸🇬", country: "Singapour", currency: "Dollar de Singapour", currencyCode: "SGD", language: "Anglais", payments: ["PayNow", "Visa"] },
  { flag: "🇮🇩", country: "Indonésie", currency: "Rupiah", currencyCode: "IDR", language: "Indonésien", payments: ["GoPay", "OVO", "DANA"] },
  { flag: "🇲🇾", country: "Malaisie", currency: "Ringgit", currencyCode: "MYR", language: "Malais", payments: ["Touch 'n Go", "GrabPay"] },
  { flag: "🇹🇭", country: "Thaïlande", currency: "Baht", currencyCode: "THB", language: "Thaï", payments: ["PromptPay", "TrueMoney"] },
  { flag: "🇻🇳", country: "Viêt Nam", currency: "Đồng", currencyCode: "VND", language: "Vietnamien", payments: ["MoMo", "ZaloPay"] },
  { flag: "🇵🇭", country: "Philippines", currency: "Peso philippin", currencyCode: "PHP", language: "Filipino", payments: ["GCash", "PayMaya"] },
  { flag: "🇰🇷", country: "Corée du Sud", currency: "Won", currencyCode: "KRW", language: "Coréen", payments: ["KakaoPay", "Naver Pay"] },
  { flag: "🇦🇪", country: "Émirats arabes unis", currency: "Dirham", currencyCode: "AED", language: "Arabe", payments: ["Apple Pay", "Visa"] },
  { flag: "🇸🇦", country: "Arabie Saoudite", currency: "Riyal", currencyCode: "SAR", language: "Arabe", payments: ["Mada", "Apple Pay"] },
  { flag: "🇮🇱", country: "Israël", currency: "Nouveau shekel", currencyCode: "ILS", language: "Hébreu", payments: ["Bit", "PayPal"] },
  { flag: "🇹🇷", country: "Turquie", currency: "Livre turque", currencyCode: "TRY", language: "Turc", payments: ["PayTR", "Visa"] },
  { flag: "🇵🇰", country: "Pakistan", currency: "Roupie pakistanaise", currencyCode: "PKR", language: "Ourdou", payments: ["JazzCash", "Easypaisa"] },
  { flag: "🇧🇩", country: "Bangladesh", currency: "Taka", currencyCode: "BDT", language: "Bengali", payments: ["bKash", "Nagad"] },
  { flag: "🇱🇰", country: "Sri Lanka", currency: "Roupie srilankaise", currencyCode: "LKR", language: "Cingalais", payments: ["Genie", "Visa"] },
  { flag: "🇰🇭", country: "Cambodge", currency: "Riel", currencyCode: "KHR", language: "Khmer", payments: ["Wing", "ABA Pay"] },

  // ----- Amérique (18 pays) -----
  { flag: "🇺🇸", country: "États-Unis", currency: "Dollar", currencyCode: "USD", language: "Anglais", payments: ["Visa", "Mastercard", "Apple Pay"] },
  { flag: "🇨🇦", country: "Canada", currency: "Dollar canadien", currencyCode: "CAD", language: "Anglais/Français", payments: ["Interac", "Visa", "PayPal"] },
  { flag: "🇧🇷", country: "Brésil", currency: "Réal", currencyCode: "BRL", language: "Portugais", payments: ["Pix", "Visa", "Mastercard"] },
  { flag: "🇲🇽", country: "Mexique", currency: "Peso mexicain", currencyCode: "MXN", language: "Espagnol", payments: ["OXXO", "Visa"] },
  { flag: "🇦🇷", country: "Argentine", currency: "Peso argentin", currencyCode: "ARS", language: "Espagnol", payments: ["Mercado Pago", "Visa"] },
  { flag: "🇨🇴", country: "Colombie", currency: "Peso colombien", currencyCode: "COP", language: "Espagnol", payments: ["PSE", "Visa"] },
  { flag: "🇨🇱", country: "Chili", currency: "Peso chilien", currencyCode: "CLP", language: "Espagnol", payments: ["Webpay", "Visa"] },
  { flag: "🇵🇪", country: "Pérou", currency: "Sol", currencyCode: "PEN", language: "Espagnol", payments: ["Yape", "Visa"] },
  { flag: "🇻🇪", country: "Venezuela", currency: "Bolivar", currencyCode: "VES", language: "Espagnol", payments: ["Pago Móvil", "Visa"] },
  { flag: "🇪🇨", country: "Équateur", currency: "Dollar", currencyCode: "USD", language: "Espagnol", payments: ["Visa", "Mastercard"] },
  { flag: "🇺🇾", country: "Uruguay", currency: "Peso uruguayen", currencyCode: "UYU", language: "Espagnol", payments: ["Visa", "Mastercard"] },
  { flag: "🇵🇾", country: "Paraguay", currency: "Guaraní", currencyCode: "PYG", language: "Espagnol", payments: ["Visa", "Mastercard"] },
  { flag: "🇧🇴", country: "Bolivie", currency: "Boliviano", currencyCode: "BOB", language: "Espagnol", payments: ["Visa", "Mastercard"] },
  { flag: "🇨🇷", country: "Costa Rica", currency: "Colón", currencyCode: "CRC", language: "Espagnol", payments: ["Visa", "Mastercard"] },
  { flag: "🇵🇦", country: "Panama", currency: "Balboa", currencyCode: "PAB", language: "Espagnol", payments: ["Visa", "Mastercard"] },
  { flag: "🇩🇴", country: "République dominicaine", currency: "Peso dominicain", currencyCode: "DOP", language: "Espagnol", payments: ["Visa", "Mastercard"] },
  { flag: "🇯🇲", country: "Jamaïque", currency: "Dollar jamaïcain", currencyCode: "JMD", language: "Anglais", payments: ["Visa", "Mastercard"] },
  { flag: "🇭🇹", country: "Haïti", currency: "Gourde", currencyCode: "HTG", language: "Français", payments: ["Visa", "Mastercard"] },

  // ----- Océanie (12 pays) -----
  { flag: "🇦🇺", country: "Australie", currency: "Dollar australien", currencyCode: "AUD", language: "Anglais", payments: ["Visa", "Mastercard", "PayPal"] },
  { flag: "🇳🇿", country: "Nouvelle-Zélande", currency: "Dollar néo-zélandais", currencyCode: "NZD", language: "Anglais", payments: ["Visa", "Mastercard", "PayPal"] },
  { flag: "🇫🇯", country: "Fidji", currency: "Dollar fidjien", currencyCode: "FJD", language: "Anglais", payments: ["Visa", "Mastercard"] },
  { flag: "🇵🇬", country: "Papouasie-Nouvelle-Guinée", currency: "Kina", currencyCode: "PGK", language: "Anglais", payments: ["Visa", "Mastercard"] },
  { flag: "🇸🇧", country: "Îles Salomon", currency: "Dollar des Salomon", currencyCode: "SBD", language: "Anglais", payments: ["Visa", "Mastercard"] },
  { flag: "🇻🇺", country: "Vanuatu", currency: "Vatu", currencyCode: "VUV", language: "Français", payments: ["Visa", "Mastercard"] },
  { flag: "🇳🇨", country: "Nouvelle-Calédonie", currency: "Franc Pacifique", currencyCode: "XPF", language: "Français", payments: ["Visa", "Mastercard"] },
  { flag: "🇵🇫", country: "Polynésie française", currency: "Franc Pacifique", currencyCode: "XPF", language: "Français", payments: ["Visa", "Mastercard"] },
  { flag: "🇼🇸", country: "Samoa", currency: "Tala", currencyCode: "WST", language: "Samoan", payments: ["Visa", "Mastercard"] },
  { flag: "🇹🇴", country: "Tonga", currency: "Paʻanga", currencyCode: "TOP", language: "Tongien", payments: ["Visa", "Mastercard"] },
  { flag: "🇰🇮", country: "Kiribati", currency: "Dollar australien", currencyCode: "AUD", language: "Anglais", payments: ["Visa", "Mastercard"] },
  { flag: "🇫🇲", country: "Micronésie", currency: "Dollar", currencyCode: "USD", language: "Anglais", payments: ["Visa", "Mastercard"] },
];

// Le reste du code (features, securityLayers, exchangeRates) reste inchangé
const features = [ /* ... */ ]; // inchangé
const securityLayers = [ /* ... */ ]; // inchangé
const exchangeRates = [ /* ... */ ]; // inchangé

const fadeUp = { /* ... */ }; // inchangé

const Index = () => {
  const { isAdmin } = useAuth();
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header – inchangé */}
      {/* Hero – inchangé */}
      {/* Features – inchangé */}

      {/* ====================================================
          🌍 SECTION MARCHÉS – affiche désormais 75+ pays
      ==================================================== */}
      <section id="markets" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-12 text-center"
          >
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
              🌍 75+ marchés actifs
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Des marchés configurés, prêts à vendre
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Nous supportons les paiements locaux, les devises et les langues de chaque région.
            </p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {markets.map((market, i) => (
              <MarketCard
                key={`${market.country}-${i}`}
                flag={market.flag}
                country={market.country}
                currency={market.currency}
                currencyCode={market.currencyCode}
                language={market.language}    // Nouvelle prop à ajouter dans MarketCard
                payments={market.payments}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Exchange Rates + Security – inchangé */}
      {/* CTA – inchangé */}
      {/* Footer – inchangé */}
    </div>
  );
};

export default Index;

// ====================================================
// 💡 CONSEILS & ORIENTATIONS
// ====================================================
// 1. Le composant `MarketCard` doit être modifié pour accepter et afficher la prop `language`.
//    Ajoutez un badge ou une ligne de texte dans la carte.
// 2. Si la liste des pays devient trop longue, envisagez d'ajouter une pagination
//    ou un filtre par continent (avec des onglets). Par exemple :
//    <Tabs> Afrique | Europe | Asie | Amérique | Océanie </Tabs>
// 3. Les moyens de paiement sont simplifiés ; vous pouvez les rendre plus précis
//    en fonction des données réelles de votre plateforme.
// 4. Pensez à mettre à jour le fichier `vite-env.d.ts` si vous ajoutez des variables
//    d'environnement pour les langues ou les devises.
// 5. Testez l'affichage sur mobile : la grille s'adapte déjà, mais vérifiez que les cartes
//    ne soient pas trop grandes.
// ====================================================              <Button size="sm" className="gap-1.5 shadow-sm shadow-primary/20">
                Boutique
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenu && (
          <div className="border-t border-border bg-card px-4 py-3 md:hidden animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-1">
              <a href="#features" onClick={() => setMobileMenu(false)} className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary">Fonctionnalités</a>
              <a href="#markets" onClick={() => setMobileMenu(false)} className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary">Marchés</a>
              <a href="#rates" onClick={() => setMobileMenu(false)} className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary">Taux</a>
              <a href="#security" onClick={() => setMobileMenu(false)} className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary">Sécurité</a>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileMenu(false)} className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Administration
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-28">
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
              Commerce international sécurisé
            </span>
            <h1 className="mb-6 text-4xl font-bold leading-[1.1] tracking-tight text-foreground lg:text-5xl">
              Un commerce adapté à <span className="text-primary">chaque marché</span>
            </h1>
            <p className="mb-8 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Plateforme e-commerce multi-marchés avec devises locales, paiements mobiles africains et sécurité de niveau bancaire.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/store">
                <Button size="lg" className="gap-2 shadow-md shadow-primary/20">
                  Voir le catalogue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/admin/login">
                <Button variant="outline" size="lg" className="gap-2">
                  <Lock className="h-4 w-4" />
                  Espace Admin
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-success" />
                <span>Chiffrement E2E</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span>15+ marchés</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <span>25+ moyens de paiement</span>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="flex justify-center"
          >
            <img src={heroGlobe} alt="Réseau de commerce mondial BULONET" className="w-full max-w-md drop-shadow-2xl" loading="eager" />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-12 text-center"
          >
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">Infrastructure complète</span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Tout ce qu'il faut pour vendre partout
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Une plateforme conçue pour le commerce international, du paiement mobile africain aux cartes bancaires européennes.
            </p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Markets */}
      <section id="markets" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-12 text-center"
          >
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">15 marchés actifs</span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Des marchés configurés, prêts à vendre
            </h2>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {markets.map((m, i) => (
              <MarketCard key={m.country} {...m} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Exchange Rates + Security */}
      <section id="rates" className="py-20 bg-secondary/30">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-2">
          {/* Exchange Rates */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl bg-card p-6 shadow-soft"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-card-foreground">Taux de change en direct</h3>
              <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
                LIVE
              </span>
            </div>
            <div>
              {exchangeRates.map((r) => (
                <ExchangeRateRow key={`${r.from}-${r.to}`} {...r} />
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Mise à jour automatique. Taux indicatifs.
            </p>
          </motion.div>

          {/* Security */}
          <motion.div
            id="security"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl bg-card p-6 shadow-soft"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Sécurité multi-couche</h3>
                <p className="text-xs text-muted-foreground">Protection de niveau bancaire</p>
              </div>
            </div>
            <ul className="space-y-3">
              {securityLayers.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2.5 text-sm text-foreground">
                  <Icon className="h-4 w-4 shrink-0 text-success" />
                  {label}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-12 text-center shadow-lg shadow-primary/20 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground relative">
              Prêt à conquérir de nouveaux marchés ?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-primary-foreground/80 relative">
              Déployez votre boutique sur 15+ marchés africains, européens et mondiaux en quelques minutes.
            </p>
            <Link to="/store">
              <Button size="lg" variant="secondary" className="gap-2 shadow-md relative">
                Explorer le catalogue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground">BULONET</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} BULONET. Commerce international sécurisé. Contact : Bulonet3@gmail.com
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
