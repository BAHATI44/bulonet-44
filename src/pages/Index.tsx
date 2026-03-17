import { Link } from "react-router-dom";
import { motion } from "framer-motion";
  Globe,
  Shield,
  CreditCard,
  BarChart3,
  Languages,
  Truck,
  Lock,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SecurityBadge from "@/components/landing/SecurityBadge";
import MarketCard from "@/components/landing/MarketCard";
import FeatureCard from "@/components/landing/FeatureCard";
import ExchangeRateRow from "@/components/landing/ExchangeRateRow";
import heroGlobe from "@/assets/hero-globe.png";

const markets = [
  { flag: "🇸🇳", country: "Sénégal", currency: "Franc CFA", currencyCode: "XOF", payments: ["Orange Money", "Wave", "Carte bancaire"] },
  { flag: "🇰🇪", country: "Kenya", currency: "Shilling", currencyCode: "KES", payments: ["M-Pesa", "Airtel Money", "Visa"] },
  { flag: "🇫🇷", country: "France", currency: "Euro", currencyCode: "EUR", payments: ["Stripe", "PayPal", "Apple Pay"] },
  { flag: "🇨🇮", country: "Côte d'Ivoire", currency: "Franc CFA", currencyCode: "XOF", payments: ["MTN Money", "Orange Money", "Moov"] },
  { flag: "🇨🇲", country: "Cameroun", currency: "Franc CFA", currencyCode: "XAF", payments: ["MTN MoMo", "Orange Money", "Express Union"] },
  { flag: "🇬🇧", country: "Royaume-Uni", currency: "Livre Sterling", currencyCode: "GBP", payments: ["Stripe", "PayPal", "Google Pay"] },
];

const features = [
  { icon: Globe, title: "Multi-marchés natif", description: "Détection automatique du pays, de la devise et de la langue. Chaque marché est configuré indépendamment." },
  { icon: CreditCard, title: "Paiements locaux", description: "M-Pesa, Orange Money, Wave, Stripe, PayPal — les moyens de paiement adaptés à chaque région." },
  { icon: Languages, title: "Multilingue intelligent", description: "Traductions par marché avec variantes régionales. Français de France ≠ Français du Sénégal." },
  { icon: Shield, title: "Sécurité bancaire", description: "Chiffrement de bout en bout, 2FA obligatoire pour les admins, audit trail complet." },
  { icon: Truck, title: "Logistique par marché", description: "Règles d'expédition, taxes et frais de douane configurés par pays de destination." },
  { icon: BarChart3, title: "Analytics par marché", description: "Tableau de bord avec métriques segmentées par pays, devise et canal de paiement." },
];

const exchangeRates = [
  { from: "EUR", to: "XOF", rate: "655.957", change: "+0.00%", positive: true },
  { from: "USD", to: "KES", rate: "129.450", change: "-0.12%", positive: false },
  { from: "EUR", to: "GBP", rate: "0.8594", change: "+0.08%", positive: true },
  { from: "USD", to: "XAF", rate: "603.125", change: "+0.03%", positive: true },
];

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight">BULONET</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Fonctionnalités</a>
            <a href="#markets" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Marchés</a>
            <a href="#rates" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Taux</a>
            <a href="#security" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Sécurité</a>
          </nav>
          <div className="flex items-center gap-3">
            <SecurityBadge />
            <Button size="sm">
              Accéder à la plateforme
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-32">
          <motion.div {...fadeUp}>
            <p className="mb-4 text-sm font-medium text-primary">Commerce international sécurisé</p>
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground lg:text-5xl">
              Un commerce adapté à chaque marché
            </h1>
            <p className="mb-8 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Plateforme e-commerce multi-marchés avec devises locales, paiements mobiles africains et sécurité de niveau bancaire.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg" className="gap-2">
                Démarrer maintenant
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                Documentation
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-success" />
                <span>Chiffrement E2E</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span>6+ marchés</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <span>15+ moyens de paiement</span>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="flex justify-center"
          >
            <img src={heroGlobe} alt="Réseau de commerce mondial BULONET" className="w-full max-w-md" />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-12"
          >
            <p className="mb-2 text-sm font-medium text-primary">Infrastructure complète</p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Tout ce qu'il faut pour vendre partout
            </h2>
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
            className="mb-12"
          >
            <p className="mb-2 text-sm font-medium text-primary">Marchés supportés</p>
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
      <section id="rates" className="py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-2">
          {/* Exchange Rates */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-lg bg-card p-6 shadow-soft"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-card-foreground">Taux de change en direct</h3>
              <span className="rounded-sm bg-success/10 px-2 py-0.5 text-xs font-medium text-success">LIVE</span>
            </div>
            <div>
              {exchangeRates.map((r) => (
                <ExchangeRateRow key={`${r.from}-${r.to}`} {...r} />
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Mise à jour automatique via l'agent exchange-rate. Taux indicatifs.
            </p>
          </motion.div>

          {/* Security */}
          <motion.div
            id="security"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-lg bg-card p-6 shadow-soft"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground">Sécurité de niveau bancaire</h3>
            </div>
            <ul className="space-y-3">
              {[
                "Authentification à deux facteurs (TOTP / biométrique)",
                "Chiffrement AES-256 des données sensibles",
                "Audit trail complet sur chaque action admin",
                "Row Level Security sur toutes les tables",
                "Détection de fraude et alertes en temps réel",
                "Conformité RGPD et PCI-DSS",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                  {item}
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
            className="rounded-lg bg-primary p-12 text-center shadow-elevated"
          >
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground">
              Prêt à conquérir de nouveaux marchés ?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-primary-foreground/80">
              Déployez votre boutique sur plusieurs marchés africains et européens en quelques minutes.
            </p>
            <Button size="lg" variant="secondary" className="gap-2">
              Commencer gratuitement
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Zap className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">BULONET</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 BULONET. Commerce international sécurisé.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
