import { Link } from "react-router-dom";
import StoreLayout from "@/components/store/StoreLayout";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ArrowRight, ShoppingCart } from "lucide-react";

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, cartTotalUsd, formatPrice, cartCount } = useStore();

  if (cart.length === 0) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Votre panier est vide</h1>
          <p className="mt-2 text-muted-foreground">Explorez notre catalogue pour trouver des produits.</p>
          <Link to="/store">
            <Button className="mt-6">Voir le catalogue</Button>
          </Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="mb-8 text-2xl font-bold text-foreground">
          Panier <span className="text-muted-foreground font-normal text-lg">({cartCount})</span>
        </h1>

        <div className="space-y-3">
          {cart.map((item) => (
            <div key={item.productId} className="flex items-center gap-4 rounded-lg bg-card p-4 shadow-soft">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-card-foreground truncate">{item.name}</h3>
                <p className="text-sm tabular-nums text-muted-foreground">{formatPrice(item.basePriceUsd)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <p className="w-24 text-right text-sm font-bold tabular-nums text-foreground">
                {formatPrice(item.basePriceUsd * item.quantity)}
              </p>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeFromCart(item.productId)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 rounded-lg bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between border-b border-dashed border-border pb-4">
            <span className="text-muted-foreground">Sous-total</span>
            <span className="text-lg font-bold tabular-nums text-foreground">{formatPrice(cartTotalUsd)}</span>
          </div>
          <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
            <span>Frais de livraison</span>
            <span>Calculés au checkout</span>
          </div>
          <Link to="/store/checkout">
            <Button size="lg" className="mt-6 w-full gap-2">
              Passer la commande — {formatPrice(cartTotalUsd)}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </StoreLayout>
  );
};

export default CartPage;
