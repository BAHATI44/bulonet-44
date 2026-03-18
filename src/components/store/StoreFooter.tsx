import { Zap, Mail, CreditCard, Smartphone } from "lucide-react";

const paymentMethods = [
  { name: "Visa", type: "card" },
  { name: "Mastercard", type: "card" },
  { name: "PayPal", type: "card" },
  { name: "Apple Pay", type: "card" },
  { name: "Orange Money", type: "mobile" },
  { name: "Wave", type: "mobile" },
  { name: "M-Pesa", type: "mobile" },
  { name: "MTN MoMo", type: "mobile" },
  { name: "Airtel Money", type: "mobile" },
];

const StoreFooter = () => {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold tracking-tight text-foreground">BULONET</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Commerce international sécurisé. Achetez en toute confiance depuis l'Afrique et partout dans le monde.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">Contact</h3>
            <a
              href="mailto:Bulonet3@gmail.com"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <Mail className="h-4 w-4" />
              Bulonet3@gmail.com
            </a>
          </div>

          {/* Payment methods - Cards */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Cartes & e-wallets
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {paymentMethods.filter((p) => p.type === "card").map((p) => (
                <span
                  key={p.name}
                  className="rounded border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground"
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>

          {/* Payment methods - Mobile */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5" />
              Mobile Money
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {paymentMethods.filter((p) => p.type === "mobile").map((p) => (
                <span
                  key={p.name}
                  className="rounded border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground"
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-border pt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} BULONET. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span>Chiffrement SSL</span>
            <span>·</span>
            <span>PCI-DSS</span>
            <span>·</span>
            <span>Protection des données</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
