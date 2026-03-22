import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, Shield, CreditCard, BarChart3, Languages, Truck, Lock, ArrowRight, Zap, Menu, X, ChevronRight, Fingerprint, ShieldCheck, Eye, Server } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const markets = [
  { flag: "🇨🇩", country: "RD Congo", currency: "CDF", payments: ["M-Pesa", "Orange Money"] },
  { flag: "🇷🇼", country: "Rwanda", currency: "RWF", payments: ["MTN MoMo"] },
  { flag: "🇲🇦", country: "Maroc", currency: "MAD", payments: ["CashPlus", "Visa"] },
  { flag: "🇿🇦", country: "Afrique du Sud", currency: "ZAR", payments: ["SnapScan", "Visa"] },
  { flag: "🇫🇷", country: "France", currency: "EUR", payments: ["Stripe", "PayPal"] },
  { flag: "🇬🇧", country: "Royaume-Uni", currency: "GBP", payments: ["Stripe"] },
  { flag: "🇨🇳", country: "Chine", currency: "CNY", payments: ["Alipay", "WeChat Pay"] },
  { flag: "🇧🇷", country: "Brésil", currency: "BRL", payments: ["Pix"] },
  { flag: "🇺🇸", country: "États-Unis", currency: "USD", payments: ["Visa", "Apple Pay"] },
  { flag: "🇨🇦", country: "Canada", currency: "CAD", payments: ["Interac", "Visa"] },
  { flag: "🇸🇦", country: "Arabie Saoudite", currency: "SAR", payments: ["Mada"] },
  { flag: "🇪🇬", country: "Égypte", currency: "EGP", payments: ["Vodafone Cash"] },
];

const features = [
  { icon: Globe, title: "Multi-marchés", desc: "15+ pays avec devises locales." },
  { icon: CreditCard, title: "Paiements locaux", desc: "M-Pesa, Pix, Mada et plus." },
  { icon: BarChart3, title: "Analytics", desc: "Tableaux de bord en temps réel." },
  { icon: Languages, title: "Multilingue", desc: "FR, EN, AR, SW et plus." },
  { icon: Truck, title: "Logistique", desc: "Suivi et frais automatiques." },
  { icon: Shield, title: "Sécurité", desc: "Chiffrement E2E, anti-fraude." },
];

const securityLayers = [
  { icon: Lock, label: "Chiffrement TLS 1.3" },
  { icon: Shield, label: "Protection DDoS" },
  { icon: Fingerprint, label: "Auth multi-facteur" },
  { icon: ShieldCheck, label: "Conformité PCI-DSS" },
  { icon: Eye, label: "Détection de fraude IA" },
  { icon: Server, label: "Infra redondante 99.9%" },
];

const Index = () => {
  const { isAdmin } = useAuth();
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary"><Zap className="h-4 w-4 text-primary-foreground" /></div>
            <span className="text-lg font-semibold tracking-tight text-foreground">BULONET</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <a href="#features" className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">Fonctionnalités</a>
            <a href="#markets" className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">Marchés</a>
            <a href="#security" className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">Sécurité</a>
            {isAdmin && <Link to="/admin" className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Admin</Link>}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/store"><Button size="sm" className="gap-1.5">Boutique <ChevronRight className="h-3.5 w-3.5" /></Button></Link>
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</Button>
          </div>
        </div>
        {mobileMenu && (
          <div className="border-t border-border bg-card px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              <a href="#features" onClick={() => setMobileMenu(false)} className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary">Fonctionnalités</a>
              <a href="#markets" onClick={() => setMobileMenu(false)} className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary">Marchés</a>
              <a href="#security" onClick={() => setMobileMenu(false)} className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary">Sécurité</a>
              {isAdmin && <Link to="/admin" onClick={() => setMobileMenu(false)} className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Admin</Link>}
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Commerce international sécurisé
            </span>
            <h1 className="mb-6 text-4xl font-bold leading-[1.1] tracking-tight text-foreground lg:text-5xl">
              Un commerce adapté à <span className="text-primary">chaque marché</span>
            </h1>
            <p className="mb-8 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Plateforme e-commerce multi-marchés avec devises locales, paiements mobiles africains et sécurité bancaire.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/store"><Button size="lg" className="gap-2">Voir le catalogue <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/admin/login"><Button variant="outline" size="lg" className="gap-2"><Lock className="h-4 w-4" /> Espace Admin</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Tout ce qu'il faut pour vendre partout</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl bg-card p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
                <f.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="text-base font-semibold text-card-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Markets */}
      <section id="markets" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Des marchés configurés, prêts à vendre</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {markets.map((m) => (
              <div key={m.country} className="rounded-xl bg-card p-5 shadow-sm border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{m.flag}</span>
                  <div><p className="font-semibold text-card-foreground">{m.country}</p><p className="text-xs text-muted-foreground">{m.currency}</p></div>
                </div>
                <div className="flex flex-wrap gap-1.5">{m.payments.map((p) => <span key={p} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{p}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-20 bg-secondary/30">
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-2xl bg-card p-8 shadow-sm border border-border/50">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10"><Shield className="h-5 w-5 text-primary" /></div>
              <div><h3 className="text-lg font-semibold text-card-foreground">Sécurité multi-couche</h3><p className="text-xs text-muted-foreground">Protection de niveau bancaire</p></div>
            </div>
            <ul className="space-y-3">
              {securityLayers.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2.5 text-sm text-foreground"><Icon className="h-4 w-4 shrink-0 text-primary" />{label}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-2xl bg-primary p-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground">Prêt à conquérir de nouveaux marchés ?</h2>
            <p className="mx-auto mb-8 max-w-xl text-primary-foreground/80">Déployez votre boutique sur 15+ marchés en quelques minutes.</p>
            <Link to="/store"><Button size="lg" variant="secondary" className="gap-2">Explorer le catalogue <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary"><Zap className="h-3.5 w-3.5 text-primary-foreground" /></div>
            <span className="text-sm font-bold text-foreground">BULONET</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} BULONET. Commerce international sécurisé.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
