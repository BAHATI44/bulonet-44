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
import MarketCard from "@/components/landing/MarketCard";
import FeatureCard from "@/components/landing/FeatureCard";
import ExchangeRateRow from "@/components/landing/ExchangeRateRow";
import heroGlobe from "@/assets/hero-globe.png";

const markets = [
  { flag: "🇨🇩", country: "RD Congo", currency: "Franc congolais", currencyCode: "CDF", payments: ["M-Pesa", "Airtel Money", "Orange Money"] },
  { flag: "🇷🇼", country: "Rwanda", currency: "Franc rwandais", currencyCode: "RWF", payments: ["MTN MoMo", "Airtel Money"] },
  { flag: "🇲🇦", country: "Maroc", currency: "Dirham", currencyCode: "MAD", payments: ["CashPlus", "Inwi Money", "Visa"] },
  { flag: "🇿🇦", country: "Afrique du Sud", currency: "Rand", currencyCode: "ZAR", payments: ["SnapScan", "Visa", "Mastercard"] },
  { flag: "🇹🇿", country: "Tanzanie", currency: "Shilling", currencyCode: "TZS", payments: ["M-Pesa", "Airtel Money", "Tigo Pesa"] },
  { flag: "🇨🇮", country: "Côte d'Ivoire", currency: "Franc CFA", currencyCode: "XOF", payments: ["MTN Money", "Orange Money", "Moov"] },
  { flag: "🇪🇬", country: "Égypte", currency: "Livre égyptienne", currencyCode: "EGP", payments: ["Vodafone Cash", "Fawry"] },
  { flag: "🇫🇷", country: "France", currency: "Euro", currencyCode: "EUR", payments: ["Stripe", "PayPal", "Apple Pay"] },
  { flag: "🇨🇳", country: "Chine", currency: "Yuan", currencyCode: "CNY", payments: ["Alipay", "WeChat Pay", "UnionPay"] },
  { flag: "🇺🇸", country: "États-Unis", currency: "Dollar", currencyCode: "USD", payments: ["Visa", "Mastercard", "Apple Pay"] },
  { flag: "🇸🇦", country: "Arabie Saoudite", currency: "Riyal", currencyCode: "SAR", payments: ["Mada", "Apple Pay", "Visa"] },
  { flag: "🇬🇧", country: "Angleterre", currency: "Livre Sterling", currencyCode: "GBP", payments: ["Stripe", "PayPal", "Google Pay"] },
  { flag: "🇮🇹", country: "Italie", currency: "Euro", currencyCode: "EUR", payments: ["Visa", "Mastercard", "PayPal"] },
  { flag: "🇧🇷", country: "Brésil", currency: "Réal", currencyCode: "BRL", payments: ["Pix", "Visa", "Mastercard"] },
  { flag: "🇨🇦", country: "Canada", currency: "Dollar canadien", currencyCode: "CAD", payments: ["Interac", "Visa", "PayPal"] },
];

const features = [
  { icon: Globe, title: "Multi-marchés natif", description: "Détection automatique du pays, de la devise et de la langue. 15+ marchés configurés." },
  { icon: CreditCard, title: "Paiements locaux", description: "M-Pesa, Orange Money, Wave, Pix, Alipay, Mada — les moyens adaptés à chaque région." },
  { icon: Languages, title: "Multilingue intelligent", description: "Traductions par marché avec variantes régionales. Français de France ≠ Français du Sénégal." },
  { icon: Shield, title: "Sécurité bancaire", description: "Chiffrement E2E, anti-brute-force, CSP headers, RLS sur toutes les tables, audit complet." },
  { icon: Truck, title: "Logistique par marché", description: "Règles d'expédition, taxes et frais de douane configurés par pays de destination." },
  { icon: BarChart3, title: "Analytics par marché", description: "Tableau de bord avec métriques segmentées par pays, devise et canal de paiement." },
];

const securityLayers = [
  { icon: Lock, label: "Chiffrement AES-256 & TLS 1.3" },
  { icon: ShieldCheck, label: "Row Level Security (RLS)" },
  { icon: Fingerprint, label: "Anti-brute-force & rate limiting" },
  { icon: Eye, label: "Content Security Policy (CSP)" },
  { icon: Server, label: "Input validation & sanitization" },
  { icon: Shield, label: "Conformité RGPD & PCI-DSS" },
];

const exchangeRates = [
  { from: "EUR", to: "XOF", rate: "655.957", change: "+0.00%", positive: true },
  { from: "USD", to: "CDF", rate: "2,845.00", change: "+0.15%", positive: true },
  { from: "USD", to: "RWF", rate: "1,302.50", change: "-0.08%", positive: false },
  { from: "EUR", to: "GBP", rate: "0.8594", change: "+0.08%", positive: true },
  { from: "USD", to: "MAD", rate: "9.8750", change: "+0.03%", positive: true },
  { from: "USD", to: "ZAR", rate: "18.250", change: "-0.22%", positive: false },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
};

const Index = () => {
  const { isAdmin } = useAuth();
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/20">
              <Zap className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">BULONET</span>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            <a href="#features" className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary">Fonctionnalités</a>
            <a href="#markets" className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary">Marchés</a>
            <a href="#rates" className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary">Taux</a>
            <a href="#security" className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary">Sécurité</a>
            {isAdmin && (
              <Link to="/admin" className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" />
                Admin
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-3">
            <SecurityBadge />
            <Link to="/store">
              <Button size="sm" className="gap-1.5 shadow-sm shadow-primary/20">
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
