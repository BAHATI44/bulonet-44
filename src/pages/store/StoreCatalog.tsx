import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StoreLayout from "@/components/store/StoreLayout";
import StoreProductCard from "@/components/store/StoreProductCard";
import { useStore } from "@/hooks/useStore";
import { Search, SlidersHorizontal, ChevronDown, Grid3X3, LayoutList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";

const ITEMS_PER_PAGE = 12;

const StoreCatalog = () => {
  const { market, formatPrice } = useStore();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  const filtered = useMemo(() => {
    let result = products ?? [];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q)
      );
    }

    // Price range
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      result = result.filter((p) => {
        const price = Number(p.base_price);
        if (max) return price >= min && price <= max;
        return price >= min;
      });
    }

    // Stock
    if (stockFilter === "instock") result = result.filter((p) => p.stock_quantity > 0);
    if (stockFilter === "low") result = result.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 10);

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "price-asc": return Number(a.base_price) - Number(b.base_price);
        case "price-desc": return Number(b.base_price) - Number(a.base_price);
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default: return 0;
      }
    });

    return result;
  }, [products, search, priceRange, stockFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page on filter change
  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  return (
    <StoreLayout>
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary via-primary to-primary/80 px-6 py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
        <div className="mx-auto max-w-7xl relative">
          <p className="text-sm font-medium text-primary-foreground/70">
            {market ? `${market.flag_emoji} ${market.name}` : "🌍 Marché mondial"}
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
        {/* Filters bar */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="hidden sm:flex items-center rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                >
                  <LayoutList className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />

            <Select value={sortBy} onValueChange={handleFilterChange(setSortBy)}>
              <SelectTrigger className="h-9 w-auto gap-1 text-xs">
                <SelectValue placeholder="Trier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Plus récent</SelectItem>
                <SelectItem value="price-asc">Prix croissant</SelectItem>
                <SelectItem value="price-desc">Prix décroissant</SelectItem>
                <SelectItem value="name-asc">Nom A→Z</SelectItem>
                <SelectItem value="name-desc">Nom Z→A</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={handleFilterChange(setPriceRange)}>
              <SelectTrigger className="h-9 w-auto gap-1 text-xs">
                <SelectValue placeholder="Prix" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les prix</SelectItem>
                <SelectItem value="0-25">$0 - $25</SelectItem>
                <SelectItem value="25-50">$25 - $50</SelectItem>
                <SelectItem value="50-100">$50 - $100</SelectItem>
                <SelectItem value="100-500">$100 - $500</SelectItem>
                <SelectItem value="500-99999">$500+</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={handleFilterChange(setStockFilter)}>
              <SelectTrigger className="h-9 w-auto gap-1 text-xs">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tout le stock</SelectItem>
                <SelectItem value="instock">En stock</SelectItem>
                <SelectItem value="low">Stock faible</SelectItem>
              </SelectContent>
            </Select>

            {(search || priceRange !== "all" || stockFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => { setSearch(""); setPriceRange("all"); setStockFilter("all"); setPage(1); }}
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {filtered.length} produit(s)
              {totalPages > 1 && ` · Page ${page}/${totalPages}`}
            </p>

            <div className={
              viewMode === "grid"
                ? "grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                : "flex flex-col gap-3"
            }>
              {paginated.map((p, i) => (
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

            {filtered.length === 0 && (
              <p className="py-20 text-center text-muted-foreground">Aucun produit trouvé</p>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </StoreLayout>
  );
};

export default StoreCatalog;
