import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StoreLayout from "@/components/store/StoreLayout";
import StoreProductCard from "@/components/store/StoreProductCard";
import { useStore } from "@/hooks/useStore";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const StoreCatalog = () => {
  const { market } = useStore();
  const [search, setSearch] = useState("");

  const { data: products, isLoading } = useQuery({
    queryKey: ["store-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = products?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <StoreLayout>
      {/* Hero banner */}
      <div className="bg-primary px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-medium text-primary-foreground/70">
            {market ? `${market.flag_emoji} ${market.name}` : "Marché mondial"}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Catalogue produits
          </h1>
          <p className="mt-2 max-w-xl text-primary-foreground/70">
            Découvrez nos produits avec les prix dans votre devise locale.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{filtered?.length ?? 0} produit(s)</p>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {filtered?.map((p, i) => (
                <StoreProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  description={p.description}
                  basePrice={Number(p.base_price)}
                  imageUrl={p.image_url}
                  stockQuantity={p.stock_quantity}
                  index={i}
                />
              ))}
            </div>
            {filtered?.length === 0 && (
              <p className="py-20 text-center text-muted-foreground">Aucun produit trouvé</p>
            )}
          </>
        )}
      </div>
    </StoreLayout>
  );
};

export default StoreCatalog;
