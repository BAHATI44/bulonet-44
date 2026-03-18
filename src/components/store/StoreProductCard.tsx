import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface StoreProductCardProps {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  imageUrl: string | null;
  stockQuantity: number;
  index: number;
}

const StoreProductCard = ({ id, name, description, basePrice, imageUrl, stockQuantity, index }: StoreProductCardProps) => {
  const { formatPrice, addToCart } = useStore();
  const navigate = useNavigate();

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({ productId: id, name, imageUrl, basePriceUsd: basePrice });
    toast.success(`${name} ajouté au panier`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2 }}
      className="group cursor-pointer rounded-lg bg-card shadow-soft transition-shadow duration-300 hover:shadow-elevated overflow-hidden"
      onClick={() => navigate(`/store/product/${id}`)}
    >
      <div className="aspect-square overflow-hidden bg-secondary">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground"><ShoppingCart className="h-10 w-10" /></div>
        )}
      </div>
      <div className="p-4">
        <h3 className="mb-1 text-sm font-semibold text-card-foreground line-clamp-1">{name}</h3>
        {description && <p className="mb-3 text-xs text-muted-foreground line-clamp-2">{description}</p>}
        <div className="flex items-center justify-between">
          <span className="text-base font-bold tabular-nums text-foreground">{formatPrice(basePrice)}</span>
          <Button size="sm" onClick={handleAdd} disabled={stockQuantity === 0} className="h-8 gap-1 text-xs">
            <ShoppingCart className="h-3.5 w-3.5" />
            {stockQuantity === 0 ? "Épuisé" : "Ajouter"}
          </Button>
        </div>
        {stockQuantity > 0 && stockQuantity <= 10 && (
          <p className="mt-2 text-[10px] font-medium text-warning">Plus que {stockQuantity} en stock</p>
        )}
      </div>
    </motion.div>
  );
};

export default StoreProductCard;
