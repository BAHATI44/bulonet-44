import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Search,
  ArrowRight,
  Check,
  AlertCircle,
  ExternalLink,
  Image as ImageIcon,
  Package,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ScrapedProduct {
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  sku: string;
  stock: number;
  specifications: string[];
  category: string;
  source: string;
  sourceUrl: string;
  screenshot?: string;
}

type ImportStep = "url" | "preview" | "mapping" | "done";

const ImportPage = () => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<ImportStep>("url");
  const [url, setUrl] = useState("");
  const [scraped, setScraped] = useState<ScrapedProduct | null>(null);

  // Mapped fields (editable by admin before import)
  const [mapped, setMapped] = useState({
    name: "",
    description: "",
    base_price: "",
    currency_code: "USD",
    sku: "",
    stock_quantity: "0",
    image_url: "",
  });

  const scrapeMutation = useMutation({
    mutationFn: async (productUrl: string) => {
      const { data, error } = await supabase.functions.invoke("scrape-product", {
        body: { url: productUrl },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Scrape failed");
      return data.product as ScrapedProduct;
    },
    onSuccess: (product) => {
      setScraped(product);
      // Pre-fill mapping with scraped data
      setMapped({
        name: product.title,
        description: product.description,
        base_price: String(product.price || ""),
        currency_code: product.currency || "USD",
        sku: product.sku || "",
        stock_quantity: String(product.stock || 0),
        image_url: product.images?.[0] || "",
      });
      setStep("preview");
    },
    onError: (err) => {
      toast.error(`Erreur de scraping : ${err.message}`);
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products").insert({
        name: mapped.name,
        description: mapped.description || null,
        base_price: Number(mapped.base_price),
        currency_code: mapped.currency_code,
        sku: mapped.sku || null,
        stock_quantity: Number(mapped.stock_quantity),
        image_url: mapped.image_url || null,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Produit importé avec succès !");
      setStep("done");
    },
    onError: () => toast.error("Erreur lors de l'import"),
  });

  const resetAll = () => {
    setStep("url");
    setUrl("");
    setScraped(null);
    setMapped({ name: "", description: "", base_price: "", currency_code: "USD", sku: "", stock_quantity: "0", image_url: "" });
  };

  return (
    <AdminLayout title="Import produits">
      {/* Progress steps */}
      <div className="mb-8 flex items-center gap-2 text-sm">
        {(["url", "preview", "mapping", "done"] as ImportStep[]).map((s, i) => {
          const labels = ["URL source", "Aperçu", "Mapping", "Terminé"];
          const isActive = s === step;
          const isDone = ["url", "preview", "mapping", "done"].indexOf(step) > i;
          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className="h-px w-6 bg-border" />}
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                isDone ? "bg-success text-success-foreground" :
                isActive ? "bg-primary text-primary-foreground" :
                "bg-secondary text-muted-foreground"
              }`}>
                {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`hidden sm:inline ${isActive ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                {labels[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step 1: URL Input */}
      {step === "url" && (
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg bg-card p-6 shadow-soft">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-card-foreground">Importer un produit</h2>
                <p className="text-sm text-muted-foreground">Collez l'URL d'un produit AliExpress ou Amazon</p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); scrapeMutation.mutate(url); }} className="space-y-4">
              <div className="space-y-2">
                <Label>URL du produit</Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.aliexpress.com/item/..."
                  required
                />
              </div>

              <div className="flex gap-2 rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Sources supportées : AliExpress, Amazon, et la plupart des boutiques en ligne.
                  Les données extraites pourront être modifiées avant l'import.
                </span>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={scrapeMutation.isPending || !url}>
                {scrapeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Analyser le produit
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && scraped && (
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Source info */}
          <div className="flex items-center justify-between rounded-lg bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-secondary px-2 py-1 text-xs font-mono font-medium uppercase text-secondary-foreground">
                {scraped.source}
              </div>
              <a
                href={scraped.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Voir l'original <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Button size="sm" onClick={() => setStep("mapping")} className="gap-1.5">
              Continuer <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Screenshot */}
          {scraped.screenshot && (
            <div className="rounded-lg bg-card p-4 shadow-soft">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Capture d'écran de la page</p>
              <img
                src={scraped.screenshot}
                alt="Page source"
                className="w-full rounded-md border border-border"
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Product info */}
            <div className="rounded-lg bg-card p-5 shadow-soft">
              <h3 className="mb-3 text-sm font-semibold text-card-foreground">Données extraites</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Titre</dt>
                  <dd className="font-medium text-foreground">{scraped.title || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Prix</dt>
                  <dd className="font-mono font-medium text-foreground">{scraped.price} {scraped.currency}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">SKU</dt>
                  <dd className="font-mono text-xs text-foreground">{scraped.sku || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Stock</dt>
                  <dd className="text-foreground">{scraped.stock || "Non détecté"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Catégorie</dt>
                  <dd className="text-foreground">{scraped.category || "—"}</dd>
                </div>
              </dl>
            </div>

            {/* Images */}
            <div className="rounded-lg bg-card p-5 shadow-soft">
              <h3 className="mb-3 text-sm font-semibold text-card-foreground">
                Images ({scraped.images?.length || 0})
              </h3>
              {scraped.images && scraped.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {scraped.images.slice(0, 6).map((img, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-md bg-secondary">
                      <img src={img} alt={`Produit ${i + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-24 items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
            </div>
          </div>

          {/* Specifications */}
          {scraped.specifications && scraped.specifications.length > 0 && (
            <div className="rounded-lg bg-card p-5 shadow-soft">
              <h3 className="mb-3 text-sm font-semibold text-card-foreground">Spécifications</h3>
              <ul className="grid gap-1 text-sm sm:grid-cols-2">
                {scraped.specifications.map((spec, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    {spec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Description */}
          {scraped.description && (
            <div className="rounded-lg bg-card p-5 shadow-soft">
              <h3 className="mb-3 text-sm font-semibold text-card-foreground">Description</h3>
              <p className="text-sm leading-relaxed text-muted-foreground line-clamp-6">{scraped.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Mapping */}
      {step === "mapping" && (
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg bg-card p-6 shadow-soft">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-card-foreground">Mapper les champs</h2>
                <p className="text-sm text-muted-foreground">Vérifiez et ajustez les données avant l'import</p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); importMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Nom du produit *</Label>
                <Input value={mapped.name} onChange={(e) => setMapped({ ...mapped, name: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={mapped.description}
                  onChange={(e) => setMapped({ ...mapped, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prix de base *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={mapped.base_price}
                    onChange={(e) => setMapped({ ...mapped, base_price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Devise</Label>
                  <Input
                    value={mapped.currency_code}
                    onChange={(e) => setMapped({ ...mapped, currency_code: e.target.value.toUpperCase() })}
                    maxLength={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input value={mapped.sku} onChange={(e) => setMapped({ ...mapped, sku: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={mapped.stock_quantity}
                    onChange={(e) => setMapped({ ...mapped, stock_quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>URL image principale</Label>
                <Input value={mapped.image_url} onChange={(e) => setMapped({ ...mapped, image_url: e.target.value })} />
                {mapped.image_url && (
                  <div className="mt-2 h-20 w-20 overflow-hidden rounded-md bg-secondary">
                    <img src={mapped.image_url} alt="Aperçu" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              {/* Other images selector */}
              {scraped && scraped.images && scraped.images.length > 1 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Autres images disponibles (cliquez pour sélectionner)</Label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {scraped.images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setMapped({ ...mapped, image_url: img })}
                        className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                          mapped.image_url === img ? "border-primary" : "border-transparent"
                        }`}
                      >
                        <img src={img} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep("preview")} className="flex-1">
                  Retour
                </Button>
                <Button type="submit" className="flex-1 gap-2" disabled={importMutation.isPending}>
                  {importMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Import en cours...</>
                  ) : (
                    <><Download className="h-4 w-4" />Importer le produit</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === "done" && (
        <div className="mx-auto max-w-md py-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Produit importé !</h2>
          <p className="mt-2 text-muted-foreground">
            Le produit a été ajouté à votre catalogue. Vous pouvez le retrouver dans la gestion des produits.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={resetAll}>
              Importer un autre produit
            </Button>
            <Button onClick={() => window.location.href = "/admin/products"}>
              Voir les produits
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ImportPage;
