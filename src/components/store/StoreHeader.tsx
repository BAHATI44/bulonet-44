import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Globe, Zap, Menu, X, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const StoreHeader = () => {
  const { cartCount, currency, setCurrencyCode, currencies, market, setMarketCode, markets } = useStore();
  const { user, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/store" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">BULONET</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex">
          <Link to="/" className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Accueil
          </Link>
          <Link to="/store" className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Catalogue
          </Link>
          {isAdmin && (
            <Link to="/admin" className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Market selector */}
          <Select value={market?.country_code ?? "FR"} onValueChange={setMarketCode}>
            <SelectTrigger className="h-9 w-auto gap-1 border-0 bg-secondary px-2 text-xs sm:px-3 sm:text-sm shadow-none">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {markets.map((m) => (
                <SelectItem key={m.country_code} value={m.country_code}>
                  <span className="flex items-center gap-2">
                    <span>{m.flag_emoji}</span>
                    <span className="hidden sm:inline">{m.name}</span>
                    <span className="sm:hidden">{m.country_code}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Currency selector */}
          <Select value={currency.code} onValueChange={setCurrencyCode}>
            <SelectTrigger className="h-9 w-auto gap-1 border-0 bg-secondary px-2 text-xs sm:px-3 sm:text-sm shadow-none font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  <span className="font-mono">{c.symbol} {c.code}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Auth link */}
          {!user && (
            <Link to="/admin/login" className="hidden md:block">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <User className="h-3.5 w-3.5" />
                Connexion
              </Button>
            </Link>
          )}

          {/* Cart */}
          <Link to="/store/cart">
            <Button variant="outline" size="sm" className="relative gap-1.5">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Panier</span>
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Mobile menu toggle */}
          <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-card px-4 py-3 md:hidden animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1">
            <Link to="/" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
              Accueil
            </Link>
            <Link to="/store" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
              Catalogue
            </Link>
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Administration
              </Link>
            )}
            {!user && (
              <Link to="/admin/login" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors flex items-center gap-2">
                <User className="h-4 w-4" />
                Connexion
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default StoreHeader;
