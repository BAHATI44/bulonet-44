import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import StoreLayout from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Minus, Plus, Trash2, ArrowRight, ShoppingCart, ShieldCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CartItem = ({ item }: { item: any }) => {
  const { updateQuantity, removeFromCart, formatPrice } = useStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = (newQty: number) => {
    if (newQty < 1) return;
    setIsUpdating(true);
    updateQuantity(item.productId, newQty);
    setIsUpdating(false);
  };

  const handleRemove = () => {
    removeFromCart(item.productId);
    toast.success("Article retiré du panier");
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} className="flex items-center gap-4 rounded-lg bg-card p-4 shadow-sm">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><ShoppingCart className="h-6 w-6" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-card-foreground truncate">{item.name}</h3>
        <p className="text-sm tabular-nums text-muted-foreground mt-1">{formatPrice(item.basePriceUsd)}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdate(item.quantity - 1)} disabled={item.quantity <= 1 || isUpdating}><Minus className="h-3 w-3" /></Button>
        <span className="w-8 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdate(item.quantity + 1)} disabled={isUpdating}><Plus className="h-3 w-3" /></Button>
      </div>
      <p className="w-24 text-right text-sm font-bold tabular-nums text-foreground">{formatPrice(item.basePriceUsd * item.quantity)}</p>
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleRemove}><Trash2 className="h-4 w-4 text-destructive" /></Button>
    </motion.div>
  );
};

const CartPage = () => {
  const { cart, cartTotalUsd, cartCount, formatPrice } = useStore();

  if (cart.length === 0) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Votre panier est vide</h1>
          <p className="mt-2 text-muted-foreground">Explorez notre catalogue pour trouver des produits.</p>
          <Link to="/store"><Button className="mt-6">Voir le catalogue</Button></Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Panier <span className="text-muted-foreground font-normal text-lg">({cartCount})</span></h1>
          <Link to="/store" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Continuer les achats</Link>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <AnimatePresence mode="popLayout">
              {cart.map((item) => <CartItem key={item.productId} item={item} />)}
            </AnimatePresence>
          </div>
          <div className="space-y-6">
            <div className="rounded-lg bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-card-foreground">Récapitulatif</h2>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Sous-total</span>
                <span className="tabular-nums font-medium text-foreground">{formatPrice(cartTotalUsd)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>Livraison</span>
                <span className="tabular-nums font-medium">Calculée au checkout</span>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between text-base font-semibold text-foreground">
                <span>Total</span>
                <span className="text-lg tabular-nums">{formatPrice(cartTotalUsd)}</span>
              </div>
              <Link to="/store/checkout">
                <Button size="lg" className="mt-6 w-full gap-2">Passer la commande <ArrowRight className="h-4 w-4" /></Button>
              </Link>
              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Paiement sécurisé
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
};

export default CartPage;
