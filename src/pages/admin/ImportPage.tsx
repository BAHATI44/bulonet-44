import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Download, Search, ArrowRight, Check, AlertCircle, ExternalLink,
  Image as ImageIcon, Package, Loader2, Upload, FileSpreadsheet, X,
} from "lucide-react";
import { toast } from "sonner";

interface ScrapedProduct {
  title: string; description: string; price: number; currency: string;
  images: string[]; sku: string; stock: number; specifications: string[];
  category: string; source: string; sourceUrl: string; screenshot?: string;
}

type ImportStep = "url" | "preview" | "mapping" | "done";

const PRODUCT_FIELDS = [
  { key: "name", label: "Nom", required: true },
  { key: "description", label: "Description", required: false },
  { key: "base_price", label: "Prix de base", required: true },
  { key: "currency_code", label: "Devise", required: false },
  { key: "sku", label: "SKU", required: false },
  { key: "stock_quantity", label: "Stock", required: false },
  { key: "image_url", label: "URL image", required: false },
] as const;

type FieldKey = typeof PRODUCT_FIELDS[number]["key"];

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const splitLine = (line: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if ((char === "," || char === ";") && !inQuotes) { result.push(current.trim()); current = ""; }
      else { current += char; }
    }
    result.push(current.trim());
    return result;
  };
  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).map(splitLine);
  return { headers, rows };
}

const ImportPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"url" | "csv">("url");

  // ======== URL IMPORT STATE ========
  const [step, setStep] = useState<ImportStep>("url");
  const [url, setUrl] = useState("");
  const [scraped, setScraped] = useState<ScrapedProduct | null>(null);
  const [mapped, setMapped] = useState({
    name: "", description: "", base_price: "", currency_code: "USD",
    sku: "", stock_quantity: "0", image_url: "",
  });

  // ======== CSV IMPORT STATE ========
  const [csvStep, setCsvStep] = useState<"upload" | "preview" | "mapping" | "importing" | "done">("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [csvMapping, setCsvMapping] = useState<Record<FieldKey, string>>({
    name: "", description: "", base_price: "", currency_code: "", sku: "", stock_quantity: "", image_url: "",
  });
  const [csvImportProgress, setCsvImportProgress] = useState({ done: 0, total: 0, errors: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  // ======== URL IMPORT MUTATIONS ========
  const scrapeMutation = useMutation({
    mutationFn: async (productUrl: string) => {
      const { data, error } = await supabase.functions.invoke("scrape-product", { body: { url: productUrl } });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Scrape failed");
      return data.product as ScrapedProduct;
    },
    onSuccess: (product) => {
      setScraped(product);
      setMapped({
        name: product.title, description: product.description,
        base_price: String(product.price || ""), currency_code: product.currency || "USD",
        sku: product.sku || "", stock_quantity: String(product.stock || 0),
        image_url: product.images?.[0] || "",
      });
      setStep("preview");
    },
    onError: (err) => toast.error(`Erreur de scraping : ${err.message}`),
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products").insert({
        name: mapped.name, description: mapped.description || null,
        base_price: Number(mapped.base_price), currency_code: mapped.currency_code,
        sku: mapped.sku || null, stock_quantity: Number(mapped.stock_quantity),
        image_url: mapped.image_url || null, is_active: true,
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

  const resetUrl = () => {
    setStep("url"); setUrl(""); setScraped(null);
    setMapped({ name: "", description: "", base_price: "", currency_code: "USD", sku: "", stock_quantity: "0", image_url: "" });
  };

  // ======== CSV HANDLERS ========
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) { toast.error("Fichier CSV vide"); return; }
      setCsvHeaders(headers);
      setCsvRows(rows);
      // Auto-map columns by name similarity
      const autoMap: Record<string, string> = {};
      PRODUCT_FIELDS.forEach((f) => {
        const match = headers.find((h) =>
          h.toLowerCase().includes(f.key.replace("_", " ")) ||
          h.toLowerCase().includes(f.label.toLowerCase()) ||
          (f.key === "name" && h.toLowerCase().includes("nom")) ||
          (f.key === "name" && h.toLowerCase().includes("title")) ||
          (f.key === "base_price" && h.toLowerCase().includes("prix")) ||
          (f.key === "base_price" && h.toLowerCase().includes("price")) ||
          (f.key === "description" && h.toLowerCase().includes("desc")) ||
          (f.key === "image_url" && h.toLowerCase().includes("image")) ||
          (f.key === "stock_quantity" && h.toLowerCase().includes("stock")) ||
          (f.key === "stock_quantity" && h.toLowerCase().includes("qty"))
        );
        autoMap[f.key] = match || "";
      });
      setCsvMapping(autoMap as Record<FieldKey, string>);
      setCsvStep("preview");
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async () => {
    setCsvStep("importing");
    const total = csvRows.length;
    setCsvImportProgress({ done: 0, total, errors: 0 });
    let errors = 0;

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const getVal = (field: FieldKey) => {
        const header = csvMapping[field];
        if (!header) return "";
        const idx = csvHeaders.indexOf(header);
        return idx >= 0 ? row[idx] ?? "" : "";
      };
      const name = getVal("name");
      if (!name) { errors++; setCsvImportProgress({ done: i + 1, total, errors }); continue; }

      const { error } = await supabase.from("products").insert({
        name,
        description: getVal("description") || null,
        base_price: Number(getVal("base_price")) || 0,
        currency_code: getVal("currency_code") || "USD",
        sku: getVal("sku") || null,
        stock_quantity: Number(getVal("stock_quantity")) || 0,
        image_url: getVal("image_url") || null,
        is_active: true,
      });
      if (error) errors++;
      setCsvImportProgress({ done: i + 1, total, errors });
    }

    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    setCsvStep("done");
    toast.success(`${total - errors} produit(s) importé(s)${errors > 0 ? `, ${errors} erreur(s)` : ""}`);
  };

  const resetCsv = () => {
    setCsvStep("upload"); setCsvHeaders([]); setCsvRows([]);
    setCsvMapping({ name: "", description: "", base_price: "", currency_code: "", sku: "", stock_quantity: "", image_url: "" });
    setCsvImportProgress({ done: 0, total: 0, errors: 0 });
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <AdminLayout title="Import produits">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "url" | "csv")} className="mb-6">
        <TabsList>
          <TabsTrigger value="url" className="gap-2"><Download className="h-4 w-4" />Import URL</TabsTrigger>
          <TabsTrigger value="csv" className="gap-2"><FileSpreadsheet className="h-4 w-4" />Import CSV</TabsTrigger>
        </TabsList>

        {/* ==================== URL TAB ==================== */}
        <TabsContent value="url">
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
                    isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}>{isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}</div>
                  <span className={`hidden sm:inline ${isActive ? "font-medium text-foreground" : "text-muted-foreground"}`}>{labels[i]}</span>
                </div>
              );
            })}
          </div>

          {step === "url" && (
            <div className="mx-auto max-w-2xl">
              <div className="rounded-lg bg-card p-6 shadow-soft">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10"><Download className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h2 className="text-base font-semibold text-card-foreground">Importer un produit</h2>
                    <p className="text-sm text-muted-foreground">Collez l'URL d'un produit AliExpress ou Amazon</p>
                  </div>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); scrapeMutation.mutate(url); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label>URL du produit</Label>
                    <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.aliexpress.com/item/..." required />
                  </div>
                  <div className="flex gap-2 rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>Sources supportées : AliExpress, Amazon, et la plupart des boutiques en ligne.</span>
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={scrapeMutation.isPending || !url}>
                    {scrapeMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Analyse en cours...</> : <><Search className="h-4 w-4" />Analyser le produit</>}
                  </Button>
                </form>
              </div>
            </div>
          )}

          {step === "preview" && scraped && (
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="flex items-center justify-between rounded-lg bg-card p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-secondary px-2 py-1 text-xs font-mono font-medium uppercase text-secondary-foreground">{scraped.source}</div>
                  <a href={scraped.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">Voir l'original <ExternalLink className="h-3 w-3" /></a>
                </div>
                <Button size="sm" onClick={() => setStep("mapping")} className="gap-1.5">Continuer <ArrowRight className="h-3.5 w-3.5" /></Button>
              </div>
              {scraped.screenshot && (
                <div className="rounded-lg bg-card p-4 shadow-soft">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Capture d'écran</p>
                  <img src={scraped.screenshot} alt="Page source" className="w-full rounded-md border border-border" />
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-card p-5 shadow-soft">
                  <h3 className="mb-3 text-sm font-semibold text-card-foreground">Données extraites</h3>
                  <dl className="space-y-2 text-sm">
                    <div><dt className="text-muted-foreground">Titre</dt><dd className="font-medium text-foreground">{scraped.title || "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Prix</dt><dd className="font-mono font-medium text-foreground">{scraped.price} {scraped.currency}</dd></div>
                    <div><dt className="text-muted-foreground">SKU</dt><dd className="font-mono text-xs text-foreground">{scraped.sku || "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Stock</dt><dd className="text-foreground">{scraped.stock || "Non détecté"}</dd></div>
                  </dl>
                </div>
                <div className="rounded-lg bg-card p-5 shadow-soft">
                  <h3 className="mb-3 text-sm font-semibold text-card-foreground">Images ({scraped.images?.length || 0})</h3>
                  {scraped.images?.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {scraped.images.slice(0, 6).map((img, i) => (
                        <div key={i} className="aspect-square overflow-hidden rounded-md bg-secondary"><img src={img} alt={`Produit ${i + 1}`} className="h-full w-full object-cover" /></div>
                      ))}
                    </div>
                  ) : <div className="flex h-24 items-center justify-center text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>}
                </div>
              </div>
            </div>
          )}

          {step === "mapping" && (
            <div className="mx-auto max-w-2xl">
              <div className="rounded-lg bg-card p-6 shadow-soft">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10"><Package className="h-5 w-5 text-primary" /></div>
                  <div><h2 className="text-base font-semibold text-card-foreground">Mapper les champs</h2><p className="text-sm text-muted-foreground">Vérifiez et ajustez les données avant l'import</p></div>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); importMutation.mutate(); }} className="space-y-4">
                  <div className="space-y-2"><Label>Nom du produit *</Label><Input value={mapped.name} onChange={(e) => setMapped({ ...mapped, name: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Description</Label><Textarea value={mapped.description} onChange={(e) => setMapped({ ...mapped, description: e.target.value })} rows={3} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Prix de base *</Label><Input type="number" step="0.01" value={mapped.base_price} onChange={(e) => setMapped({ ...mapped, base_price: e.target.value })} required /></div>
                    <div className="space-y-2"><Label>Devise</Label><Input value={mapped.currency_code} onChange={(e) => setMapped({ ...mapped, currency_code: e.target.value.toUpperCase() })} maxLength={3} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>SKU</Label><Input value={mapped.sku} onChange={(e) => setMapped({ ...mapped, sku: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Stock</Label><Input type="number" value={mapped.stock_quantity} onChange={(e) => setMapped({ ...mapped, stock_quantity: e.target.value })} /></div>
                  </div>
                  <div className="space-y-2">
                    <Label>URL image principale</Label>
                    <Input value={mapped.image_url} onChange={(e) => setMapped({ ...mapped, image_url: e.target.value })} />
                    {mapped.image_url && <div className="mt-2 h-20 w-20 overflow-hidden rounded-md bg-secondary"><img src={mapped.image_url} alt="Aperçu" className="h-full w-full object-cover" /></div>}
                  </div>
                  {scraped?.images && scraped.images.length > 1 && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Autres images disponibles</Label>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {scraped.images.map((img, i) => (
                          <button key={i} type="button" onClick={() => setMapped({ ...mapped, image_url: img })} className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-all ${mapped.image_url === img ? "border-primary" : "border-transparent"}`}>
                            <img src={img} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setStep("preview")} className="flex-1">Retour</Button>
                    <Button type="submit" className="flex-1 gap-2" disabled={importMutation.isPending}>
                      {importMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Import...</> : <><Download className="h-4 w-4" />Importer</>}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="mx-auto max-w-md py-12 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10"><Check className="h-8 w-8 text-success" /></div>
              <h2 className="text-2xl font-bold text-foreground">Produit importé !</h2>
              <p className="mt-2 text-muted-foreground">Le produit a été ajouté à votre catalogue.</p>
              <div className="mt-6 flex justify-center gap-3">
                <Button variant="outline" onClick={resetUrl}>Importer un autre</Button>
                <Button onClick={() => window.location.href = "/admin/products"}>Voir les produits</Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ==================== CSV TAB ==================== */}
        <TabsContent value="csv">
          {/* CSV Progress */}
          <div className="mb-8 flex items-center gap-2 text-sm">
            {(["upload", "preview", "mapping", "done"] as const).map((s, i) => {
              const labels = ["Fichier", "Aperçu", "Mapping", "Terminé"];
              const steps = ["upload", "preview", "mapping", "done"];
              const isActive = s === csvStep || (s === "mapping" && csvStep === "importing");
              const isDone = steps.indexOf(csvStep) > i || (csvStep === "importing" && i < 2);
              return (
                <div key={s} className="flex items-center gap-2">
                  {i > 0 && <div className="h-px w-6 bg-border" />}
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                    isDone ? "bg-success text-success-foreground" :
                    isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}>{isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}</div>
                  <span className={`hidden sm:inline ${isActive ? "font-medium text-foreground" : "text-muted-foreground"}`}>{labels[i]}</span>
                </div>
              );
            })}
          </div>

          {csvStep === "upload" && (
            <div className="mx-auto max-w-2xl">
              <div className="rounded-lg bg-card p-6 shadow-soft">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10"><Upload className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h2 className="text-base font-semibold text-card-foreground">Import en masse CSV</h2>
                    <p className="text-sm text-muted-foreground">Importez plusieurs produits depuis un fichier CSV</p>
                  </div>
                </div>
                <label className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50 hover:bg-secondary/30">
                  <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Cliquez ou glissez un fichier CSV</span>
                  <span className="text-xs text-muted-foreground">Séparateur virgule (,) ou point-virgule (;)</span>
                  <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                </label>
                <div className="mt-4 flex gap-2 rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>La première ligne doit contenir les en-têtes. Colonnes attendues : nom, prix, description, sku, stock, image_url</span>
                </div>
              </div>
            </div>
          )}

          {csvStep === "preview" && (
            <div className="mx-auto max-w-5xl space-y-6">
              <div className="flex items-center justify-between rounded-lg bg-card p-4 shadow-soft">
                <p className="text-sm text-card-foreground"><span className="font-semibold">{csvRows.length}</span> ligne(s) détectée(s) · <span className="font-semibold">{csvHeaders.length}</span> colonne(s)</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={resetCsv}>Annuler</Button>
                  <Button size="sm" onClick={() => setCsvStep("mapping")} className="gap-1.5">Mapper les champs <ArrowRight className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="rounded-lg bg-card shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">#</TableHead>
                        {csvHeaders.map((h) => <TableHead key={h}>{h}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvRows.slice(0, 20).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-center text-xs text-muted-foreground">{i + 1}</TableCell>
                          {row.map((cell, j) => <TableCell key={j} className="max-w-[200px] truncate text-xs">{cell}</TableCell>)}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {csvRows.length > 20 && <p className="border-t border-border p-3 text-center text-xs text-muted-foreground">… et {csvRows.length - 20} lignes de plus</p>}
              </div>
            </div>
          )}

          {(csvStep === "mapping" || csvStep === "importing") && (
            <div className="mx-auto max-w-2xl">
              <div className="rounded-lg bg-card p-6 shadow-soft">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10"><Package className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h2 className="text-base font-semibold text-card-foreground">Mapper les colonnes</h2>
                    <p className="text-sm text-muted-foreground">Associez chaque champ produit à une colonne CSV</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {PRODUCT_FIELDS.map((f) => (
                    <div key={f.key} className="flex items-center gap-4">
                      <Label className="w-32 shrink-0 text-right text-sm">
                        {f.label}{f.required && " *"}
                      </Label>
                      <Select value={csvMapping[f.key]} onValueChange={(v) => setCsvMapping({ ...csvMapping, [f.key]: v })} disabled={csvStep === "importing"}>
                        <SelectTrigger><SelectValue placeholder="— Ignorer —" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Ignorer —</SelectItem>
                          {csvHeaders.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                {csvStep === "importing" && (
                  <div className="mt-6">
                    <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                      <span>Import en cours…</span>
                      <span>{csvImportProgress.done}/{csvImportProgress.total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(csvImportProgress.done / csvImportProgress.total) * 100}%` }} />
                    </div>
                    {csvImportProgress.errors > 0 && <p className="mt-1 text-xs text-destructive">{csvImportProgress.errors} erreur(s)</p>}
                  </div>
                )}
                {csvStep === "mapping" && (
                  <div className="mt-6 flex gap-3">
                    <Button variant="outline" onClick={() => setCsvStep("preview")} className="flex-1">Retour</Button>
                    <Button onClick={handleCsvImport} className="flex-1 gap-2" disabled={!csvMapping.name}>
                      <Upload className="h-4 w-4" />Importer {csvRows.length} produit(s)
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {csvStep === "done" && (
            <div className="mx-auto max-w-md py-12 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10"><Check className="h-8 w-8 text-success" /></div>
              <h2 className="text-2xl font-bold text-foreground">Import terminé !</h2>
              <p className="mt-2 text-muted-foreground">
                {csvImportProgress.total - csvImportProgress.errors} produit(s) importé(s) sur {csvImportProgress.total}.
                {csvImportProgress.errors > 0 && ` ${csvImportProgress.errors} erreur(s).`}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button variant="outline" onClick={resetCsv}>Nouvel import CSV</Button>
                <Button onClick={() => window.location.href = "/admin/products"}>Voir les produits</Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default ImportPage;
