// ======================================================
// Fichier     : src/pages/store/StoreCatalog.tsx
// Projet      : Bulonet 🚀
// Description : Page catalogue de la boutique – affiche les produits
//               avec filtres (recherche, prix, stock, tri), pagination,
//               changement de vue (grille/liste). Utilise React Query
//               pour les données et des hooks personnalisés pour la logique.
//               Intègre des fonctionnalités avancées : debounce sur la recherche,
//               gestion d'erreur, squelette de chargement, et métadonnées SEO.
// ======================================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StoreLayout from "@/components/store/StoreLayout";
import StoreProductCard from "@/components/store/StoreProductCard";
import { useStore } from "@/hooks/useStore";
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  LayoutList,
  X,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce"; // Hook personnalisé
import { Helmet } from "react-helmet-async"; // Pour SEO
import { Skeleton } from "@/components/ui/skeleton"; // Pour les états de chargement
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"; // Pour les filtres sur mobile

// ====================================================
// 🧩 CONSTANTES
// ====================================================
const ITEMS_PER_PAGE = 12;
const DEBOUNCE_DELAY = 300; // ms pour la recherche

// ====================================================
// 🎯 COMPOSANTS INTERNES (pour organiser le code)
// ====================================================

/**
 * 🔍 Barre de recherche avec debounce
 */
const SearchBar = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, DEBOUNCE_DELAY);

  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder || "Rechercher..."}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-10 pr-10"
      />
      {localValue && (
        <button
          onClick={() => setLocalValue("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

/**
 * 📊 Barre de filtres (tri, prix, stock)
 */
const FilterBar = ({
  sortBy,
  onSortChange,
  priceRange,
  onPriceRangeChange,
  stockFilter,
  onStockFilterChange,
  onReset,
  hasActiveFilters,
}: {
  sortBy: string;
  onSortChange: (val: string) => void;
  priceRange: string;
  onPriceRangeChange: (val: string) => void;
  stockFilter: string;
  onStockFilterChange: (val: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />

      <Select value={sortBy} onValueChange={onSortChange}>
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

      <Select value={priceRange} onValueChange={onPriceRangeChange}>
        <SelectTrigger className="h-9 w-auto gap-1 text-xs">
          <SelectValue placeholder="Prix" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les prix</SelectItem>
          <SelectItem value="0-25">0 - 25 {useStore().market?.currencyCode || "€"}</SelectItem>
          <SelectItem value="25-50">25 - 50 {useStore().market?.currencyCode || "€"}</SelectItem>
          <SelectItem value="50-100">50 - 100 {useStore().market?.currencyCode || "€"}</SelectItem>
          <SelectItem value="100-500">100 - 500 {useStore().market?.currencyCode || "€"}</SelectItem>
          <SelectItem value="500-99999">500+ {useStore().market?.currencyCode || "€"}</SelectItem>
        </SelectContent>
      </Select>

      <Select value={stockFilter} onValueChange={onStockFilterChange}>
        <SelectTrigger className="h-9 w-auto gap-1 text-xs">
          <SelectValue placeholder="Stock" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tout le stock</SelectItem>
          <SelectItem value="instock">En stock</SelectItem>
          <SelectItem value="low">Stock faible (≤10)</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={onReset}
        >
          Réinitialiser
        </Button>
      )}
    </div>
  );
};

/**
 * 🧱 Grille de produits avec squelette de chargement
 */
const ProductGrid = ({
  products,
  viewMode,
  isLoading,
}: {
  products: any[];
  viewMode: "grid" | "list";
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div
        className={
          viewMode === "grid"
            ? "grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            : "flex flex-col gap-3"
        }
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Aucun produit trouvé</p>
        <p className="text-sm text-muted-foreground">Essayez de modifier vos filtres</p>
      </div>
    );
  }

  return (
    <div
      className={
        viewMode === "grid"
          ? "grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          : "flex flex-col gap-3"
      }
    >
      {products.map((product, index) => (
        <StoreProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          description={product.description}
          basePrice={Number(product.base_price)}
          imageUrl={product.image_url}
          stockQuantity={product.stock_quantity}
          index={index}
        />
      ))}
    </div>
  );
};

/**
 * 📄 Pagination avec logique d'affichage intelligent
 */
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const delta = 2; // Nombre de pages de chaque côté de la page courante
    const range = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift("...");
    }
    if (currentPage + delta < totalPages - 1) {
      range.push("...");
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Précédent
      </Button>

      {getPageNumbers().map((page, idx) =>
        page === "..." ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => onPageChange(page as number)}
          >
            {page}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Suivant
      </Button>
    </div>
  );
};

// ====================================================
// 🧠 HOOK PERSONNALISÉ : logique de filtrage/pagination
// ====================================================
const useCatalog = (products: any[] | undefined) => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Réinitialiser la page quand un filtre change
  const handleFilterChange = useCallback(
    (setter: (v: string) => void) => (v: string) => {
      setter(v);
      setPage(1);
    },
    []
  );

  // Application des filtres
  const filtered = useMemo(() => {
    if (!products) return [];

    let result = [...products];

    // Recherche
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase() || "").includes(q) ||
          (p.sku?.toLowerCase() || "").includes(q) ||
          (p.category?.toLowerCase() || "").includes(q) // Ajout d'une catégorie
      );
    }

    // Fourchette de prix
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      result = result.filter((p) => {
        const price = Number(p.base_price);
        if (max) return price >= min && price <= max;
        return price >= min;
      });
    }

    // Stock
    if (stockFilter === "instock") {
      result = result.filter((p) => p.stock_quantity > 0);
    } else if (stockFilter === "low") {
      result = result.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 10);
    }

    // Tri
    result.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return Number(a.base_price) - Number(b.base_price);
        case "price-desc":
          return Number(b.base_price) - Number(a.base_price);
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [products, search, priceRange, stockFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const hasActiveFilters = search !== "" || priceRange !== "all" || stockFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setPriceRange("all");
    setStockFilter("all");
    setSortBy("newest");
    setPage(1);
  };

  return {
    search,
    setSearch,
    sortBy,
    setSortBy: handleFilterChange(setSortBy),
    priceRange,
    setPriceRange: handleFilterChange(setPriceRange),
    stockFilter,
    setStockFilter: handleFilterChange(setStockFilter),
    page,
    setPage,
    filtered,
    paginated,
    totalPages,
    hasActiveFilters,
    resetFilters,
  };
};

// ====================================================
// 🏠 COMPOSANT PRINCIPAL
// ====================================================
const StoreCatalog = () => {
  const { market, formatPrice } = useStore();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Requête des produits
  const {
    data: products,
    isLoading,
    error,
    refetch,
  } = useQuery({
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
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  const catalog = useCatalog(products);

  // Gestion d'erreur
  if (error) {
    return (
      <StoreLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-destructive">Erreur lors du chargement des produits</p>
          <Button onClick={() => refetch()} variant="outline" className="mt-4">
            Réessayer
          </Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      {/* 🧠 SEO */}
      <Helmet>
        <title>Catalogue produits - Bulonet</title>
        <meta
          name="description"
          content="Découvrez tous nos produits disponibles à l'achat. Prix dans votre devise locale."
        />
      </Helmet>

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
        {/* Barre de filtres (desktop) */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchBar
              value={catalog.search}
              onChange={catalog.setSearch}
              placeholder="Rechercher un produit, une catégorie..."
            />

            <div className="flex items-center gap-2">
              {/* Bouton filtres mobile */}
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="sm:hidden gap-1">
                    <Filter className="h-4 w-4" />
                    Filtres
                    {catalog.hasActiveFilters && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1">
                        !
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:hidden">
                  <SheetHeader>
                    <SheetTitle>Filtres</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-4">
                    <FilterBar
                      sortBy={catalog.sortBy}
                      onSortChange={catalog.setSortBy}
                      priceRange={catalog.priceRange}
                      onPriceRangeChange={catalog.setPriceRange}
                      stockFilter={catalog.stockFilter}
                      onStockFilterChange={catalog.setStockFilter}
                      onReset={catalog.resetFilters}
                      hasActiveFilters={catalog.hasActiveFilters}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Basculer vue grille/liste */}
              <div className="hidden sm:flex items-center rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                  aria-label="Vue grille"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-colors ${
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                  aria-label="Vue liste"
                >
                  <LayoutList className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Barre de filtres (desktop) */}
          <div className="hidden sm:block">
            <FilterBar
              sortBy={catalog.sortBy}
              onSortChange={catalog.setSortBy}
              priceRange={catalog.priceRange}
              onPriceRangeChange={catalog.setPriceRange}
              stockFilter={catalog.stockFilter}
              onStockFilterChange={catalog.setStockFilter}
              onReset={catalog.resetFilters}
              hasActiveFilters={catalog.hasActiveFilters}
            />
          </div>
        </div>

        {/* Résumé et compteur */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {catalog.filtered.length} produit(s)
            {catalog.totalPages > 1 && ` · Page ${catalog.page}/${catalog.totalPages}`}
          </p>
          {catalog.hasActiveFilters && (
            <Button variant="link" size="sm" onClick={catalog.resetFilters} className="text-xs">
              Effacer tous les filtres
            </Button>
          )}
        </div>

        {/* Grille de produits */}
        <ProductGrid
          products={catalog.paginated}
          viewMode={viewMode}
          isLoading={isLoading}
        />

        {/* Pagination */}
        <Pagination
          currentPage={catalog.page}
          totalPages={catalog.totalPages}
          onPageChange={catalog.setPage}
        />
      </div>
    </StoreLayout>
  );
};

export default StoreCatalog;

// ====================================================
// 💡 CONSEILS & ORIENTATIONS
// ====================================================
// 1. Ce fichier doit être placé dans `src/pages/store/StoreCatalog.tsx`.
// 2. Il utilise plusieurs hooks personnalisés :
//    - `useDebounce` : à créer dans `src/hooks/useDebounce.ts`
//    - `useStore` : déjà existant (fournit market, formatPrice)
// 3. Les composants UI (Sheet, Skeleton, Badge) viennent de shadcn/ui.
//    Assurez-vous de les avoir installés.
// 4. Pour améliorer encore :
//    - Ajouter un filtre par catégorie si vous avez une table `categories`.
//    - Utiliser `react-intersection-observer` pour l'infinite scroll.
//    - Intégrer des recommandations d'agents IA (ex:              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
