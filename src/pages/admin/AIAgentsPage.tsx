import { useState, useRef, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bot, Brain, ShoppingCart, Search, Truck, CreditCard, Send, Loader2, Settings2, Sparkles, TrendingUp, MessageSquare, Eye, Shield, Package, BarChart3, FileText, AlertTriangle, Repeat, Globe, Calculator, Users, Star, Zap } from "lucide-react";

interface Agent { id: string; name: string; description: string; category: string; icon: React.ElementType; systemPrompt: string; model: string; enabled: boolean; }

const defaultAgents: Agent[] = [
  { id: "agent-gen", name: "Générateur d'Agents", description: "Crée de nouveaux agents IA.", category: "ia", icon: Sparkles, systemPrompt: "Tu es un agent qui génère des configurations pour de nouveaux agents. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "optim-model", name: "Optimisation Modèles", description: "Améliore performances ML.", category: "ia", icon: Settings2, systemPrompt: "Tu es un agent d'optimisation de modèles ML. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "pred-sales", name: "Prédiction Ventes", description: "Anticipe volumes de vente.", category: "ia", icon: TrendingUp, systemPrompt: "Tu es un agent de prédiction des ventes. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "reco-prod", name: "Recommandation Produits", description: "Suggère produits personnalisés.", category: "ia", icon: Star, systemPrompt: "Tu es un agent de recommandation produits. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "nlp", name: "Traitement Langage", description: "Analyse avis, extrait sentiments.", category: "ia", icon: MessageSquare, systemPrompt: "Tu es un agent NLP pour e-commerce. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "vision", name: "Vision Ordinateur", description: "Analyse images produits.", category: "ia", icon: Eye, systemPrompt: "Tu es un agent de vision par ordinateur. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "content-gen", name: "Génération Contenu", description: "Rédige descriptions SEO.", category: "ia", icon: FileText, systemPrompt: "Tu es un agent de génération de contenu e-commerce BULONET. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "chatbot", name: "Chatbot Multilingue", description: "Répond en FR, EN, AR, SW.", category: "ia", icon: MessageSquare, systemPrompt: "Tu es un chatbot multilingue BULONET. Réponds dans la langue du message.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "anomaly", name: "Détection Anomalies", description: "Repère comportements inhabituels.", category: "ia", icon: AlertTriangle, systemPrompt: "Tu es un agent de détection d'anomalies. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "rpa", name: "Automatisation", description: "Automatise tâches répétitives.", category: "ia", icon: Repeat, systemPrompt: "Tu es un agent d'automatisation. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "sentiment", name: "Analyse Sentiments", description: "Détecte émotions dans les avis.", category: "ia", icon: Brain, systemPrompt: "Tu es un agent d'analyse des sentiments. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "classif", name: "Classification Auto", description: "Classe produits automatiquement.", category: "ia", icon: Package, systemPrompt: "Tu es un agent de classification automatique. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "onboard-seller", name: "Onboarding Vendeurs", description: "Accompagne inscription vendeurs.", category: "marketplace", icon: Users, systemPrompt: "Tu es un agent d'onboarding vendeurs. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "score-seller", name: "Scoring Vendeurs", description: "Évalue fiabilité vendeurs.", category: "marketplace", icon: BarChart3, systemPrompt: "Tu es un agent de scoring vendeurs. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "valid-prod", name: "Validation Produits", description: "Vérifie conformité annonces.", category: "marketplace", icon: Shield, systemPrompt: "Tu es un agent de validation de produits. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "improve-listing", name: "Amélioration Fiches", description: "Optimise titres et SEO.", category: "marketplace", icon: FileText, systemPrompt: "Tu es un agent d'amélioration des fiches produits. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "auto-categ", name: "Catégorisation Auto", description: "Place produits dans la bonne catégorie.", category: "marketplace", icon: Package, systemPrompt: "Tu es un agent de catégorisation automatique. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "data-clean", name: "Nettoyage Données", description: "Élimine doublons catalogue.", category: "marketplace", icon: Repeat, systemPrompt: "Tu es un agent de nettoyage de données. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "review-mgmt", name: "Gestion Avis", description: "Modère avis, filtre spam.", category: "marketplace", icon: MessageSquare, systemPrompt: "Tu es un agent de gestion des avis. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "counterfeit", name: "Détection Contrefaçons", description: "Identifie produits suspects.", category: "marketplace", icon: Shield, systemPrompt: "Tu es un agent de détection de contrefaçons. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "commission", name: "Optimisation Commissions", description: "Calcule frais optimaux.", category: "marketplace", icon: Calculator, systemPrompt: "Tu es un agent d'optimisation des commissions. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "promo-mgmt", name: "Gestion Promotions", description: "Crée campagnes promo.", category: "marketplace", icon: Zap, systemPrompt: "Tu es un agent de gestion des promotions. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "scrape-aliex", name: "Scraping AliExpress/Amazon", description: "Extrait données produits.", category: "sourcing", icon: Globe, systemPrompt: "Tu es un agent de scraping e-commerce. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "trends", name: "Détection Tendances", description: "Identifie produits émergents.", category: "sourcing", icon: TrendingUp, systemPrompt: "Tu es un agent de détection de tendances. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "compare-suppliers", name: "Comparateur Fournisseurs", description: "Compare offres fournisseurs.", category: "sourcing", icon: BarChart3, systemPrompt: "Tu es un agent comparateur de fournisseurs. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "auto-negoc", name: "Négociation Auto", description: "Rédige devis et contre-offres.", category: "sourcing", icon: MessageSquare, systemPrompt: "Tu es un agent de négociation automatisée. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "supplier-orders", name: "Commandes Fournisseurs", description: "Génère bons de commande.", category: "sourcing", icon: ShoppingCart, systemPrompt: "Tu es un agent de gestion des commandes fournisseurs. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "import-costs", name: "Coûts Import", description: "Calcule droits douane.", category: "sourcing", icon: Calculator, systemPrompt: "Tu es un agent d'analyse des coûts d'import. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "supplier-stock", name: "Rupture Fournisseur", description: "Surveille stocks fournisseurs.", category: "sourcing", icon: AlertTriangle, systemPrompt: "Tu es un agent de détection de rupture fournisseur. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "supplier-quality", name: "Qualité Fournisseur", description: "Score qualité fournisseurs.", category: "sourcing", icon: Star, systemPrompt: "Tu es un agent d'évaluation qualité fournisseur. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "lot-optim", name: "Optimisation Lots", description: "Quantités d'achat optimales.", category: "sourcing", icon: Package, systemPrompt: "Tu es un agent d'optimisation des lots d'achat. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "route-optim", name: "Optimisation Itinéraires", description: "Calcule trajets efficaces.", category: "logistique", icon: Truck, systemPrompt: "Tu es un agent d'optimisation des itinéraires. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "parcel-track", name: "Suivi Colis", description: "Informe clients, gère retards.", category: "logistique", icon: Package, systemPrompt: "Tu es un agent de suivi des colis. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "stock-mgmt", name: "Gestion Stocks", description: "Optimise niveaux de stock.", category: "logistique", icon: Package, systemPrompt: "Tu es un agent de gestion des stocks. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "stock-predict", name: "Prévision Ruptures", description: "Anticipe ruptures de stock.", category: "logistique", icon: AlertTriangle, systemPrompt: "Tu es un agent de prévision des ruptures. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "returns", name: "Gestion Retours", description: "Automatise retours.", category: "logistique", icon: Repeat, systemPrompt: "Tu es un agent de gestion des retours. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "carrier-choice", name: "Choix Transporteur", description: "Sélectionne meilleur transporteur.", category: "logistique", icon: Truck, systemPrompt: "Tu es un agent de choix du transporteur. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "shipping-calc", name: "Frais de Port", description: "Calcule frais dynamiquement.", category: "logistique", icon: Calculator, systemPrompt: "Tu es un agent de calcul des frais de port. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "intl-orders", name: "Commandes Internationales", description: "Gère formalités douanières.", category: "logistique", icon: Globe, systemPrompt: "Tu es un agent de gestion des commandes internationales. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "lost-parcels", name: "Colis Perdus", description: "Identifie colis en souffrance.", category: "logistique", icon: Search, systemPrompt: "Tu es un agent de détection des colis perdus. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "carrier-perf", name: "Performance Transporteurs", description: "Note transporteurs.", category: "logistique", icon: BarChart3, systemPrompt: "Tu es un agent d'évaluation des transporteurs. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "pay-valid", name: "Validation Paiements", description: "Vérifie légitimité transactions.", category: "paiement", icon: CreditCard, systemPrompt: "Tu es un agent de validation des paiements. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "mobile-money", name: "Mobile Money", description: "Gère M-Pesa, Orange Money.", category: "paiement", icon: CreditCard, systemPrompt: "Tu es un agent d'intégration Mobile Money. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "fraud-detect", name: "Détection Fraude", description: "Analyse patterns frauduleux.", category: "paiement", icon: Shield, systemPrompt: "Tu es un agent de détection de fraude. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "refund-mgmt", name: "Remboursements", description: "Automatise remboursements.", category: "paiement", icon: Repeat, systemPrompt: "Tu es un agent de gestion des remboursements. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "pci-compliance", name: "Conformité PCI-DSS", description: "Audite flux paiement.", category: "paiement", icon: Shield, systemPrompt: "Tu es un agent de conformité PCI-DSS. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "currency-mgmt", name: "Gestion Devises", description: "Convertit montants temps réel.", category: "paiement", icon: Globe, systemPrompt: "Tu es un agent de gestion des devises. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "id-fraud", name: "Fraude Identité", description: "Vérifie identité utilisateurs.", category: "paiement", icon: Users, systemPrompt: "Tu es un agent de détection de fraude à l'identité. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "chargeback", name: "Litiges Paiement", description: "Traite chargebacks.", category: "paiement", icon: AlertTriangle, systemPrompt: "Tu es un agent de gestion des litiges paiement. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
  { id: "pay-conversion", name: "Conversion Paiement", description: "Optimise taux conversion.", category: "paiement", icon: BarChart3, systemPrompt: "Tu es un agent d'optimisation conversion paiement. Réponds en français.", model: "google/gemini-3-flash-preview", enabled: true },
];

const categories = [
  { key: "ia", label: "🧠 IA & ML" },
  { key: "marketplace", label: "🛒 Marketplace" },
  { key: "sourcing", label: "🔍 Sourcing" },
  { key: "logistique", label: "📦 Logistique" },
  { key: "paiement", label: "💳 Paiement" },
];

const models = ["google/gemini-3-flash-preview", "google/gemini-2.5-flash", "google/gemini-2.5-pro", "openai/gpt-5-mini", "openai/gpt-5"];

const AIAgentsPage = () => {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [chatAgent, setChatAgent] = useState<Agent | null>(null);
  const [configAgent, setConfigAgent] = useState<Agent | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const filtered = agents.filter((a) => {
    const ms = a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
    return ms && (activeCategory === "all" || a.category === activeCategory);
  });

  const toggleAgent = (id: string) => {
    setAgents((p) => p.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a));
    const ag = agents.find((a) => a.id === id);
    toast.success(ag?.enabled ? `${ag.name} désactivé` : `${ag?.name} activé`);
  };

  const updateAgentConfig = (id: string, updates: Partial<Agent>) => {
    setAgents((p) => p.map((a) => a.id === id ? { ...a, ...updates } : a));
    toast.success("Configuration mise à jour");
    setConfigAgent(null);
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !chatAgent || isStreaming) return;
    const userMsg = { role: "user", content: chatInput };
    const msgs = [...chatMessages, userMsg];
    setChatMessages(msgs);
    setChatInput("");
    setIsStreaming(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ agentId: chatAgent.id, message: chatInput, systemPrompt: chatAgent.systemPrompt, model: chatAgent.model }),
      });
      if (!resp.ok) { const err = await resp.json().catch(() => ({ error: "Erreur" })); toast.error(err.error || "Erreur IA"); setIsStreaming(false); return; }
      const reader = resp.body?.getReader();
      if (!reader) { setIsStreaming(false); return; }
      const decoder = new TextDecoder();
      let buffer = "", assistantContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx); buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try { const p = JSON.parse(json); const d = p.choices?.[0]?.delta?.content; if (d) { assistantContent += d; setChatMessages([...msgs, { role: "assistant", content: assistantContent }]); } } catch { /* partial */ }
        }
      }
      if (!assistantContent) setChatMessages([...msgs, { role: "assistant", content: "(Pas de réponse)" }]);
    } catch { toast.error("Erreur connexion IA"); } finally { setIsStreaming(false); }
  };

  const openChat = (agent: Agent) => { setChatAgent(agent); setChatMessages([]); setChatInput(""); };
  const enabledCount = agents.filter((a) => a.enabled).length;

  return (
    <AdminLayout title="Agents IA">
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-card p-4 border border-border"><p className="text-2xl font-bold text-foreground">{agents.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
          <div className="rounded-xl bg-card p-4 border border-border"><p className="text-2xl font-bold text-emerald-500">{enabledCount}</p><p className="text-xs text-muted-foreground">Actifs</p></div>
          <div className="rounded-xl bg-card p-4 border border-border"><p className="text-2xl font-bold text-muted-foreground">{agents.length - enabledCount}</p><p className="text-xs text-muted-foreground">Inactifs</p></div>
          <div className="rounded-xl bg-card p-4 border border-border"><p className="text-2xl font-bold text-primary">{categories.length}</p><p className="text-xs text-muted-foreground">Catégories</p></div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-sm" />
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant={activeCategory === "all" ? "default" : "outline"} onClick={() => setActiveCategory("all")}>Tous</Button>
            {categories.map((c) => <Button key={c.key} size="sm" variant={activeCategory === c.key ? "default" : "outline"} onClick={() => setActiveCategory(c.key)}>{c.label}</Button>)}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => (
            <div key={agent.id} className="rounded-xl bg-card p-4 border border-border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${agent.enabled ? "bg-primary/10" : "bg-muted"}`}><agent.icon className={`h-4 w-4 ${agent.enabled ? "text-primary" : "text-muted-foreground"}`} /></div>
                  <div><p className="text-sm font-semibold text-card-foreground">{agent.name}</p><Badge variant="outline" className="text-[9px] mt-0.5">{categories.find((c) => c.key === agent.category)?.label}</Badge></div>
                </div>
                <Switch checked={agent.enabled} onCheckedChange={() => toggleAgent(agent.id)} />
              </div>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{agent.description}</p>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => openChat(agent)} disabled={!agent.enabled}><Bot className="h-3 w-3 mr-1" /> Tester</Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setConfigAgent(agent)}><Settings2 className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">Aucun agent trouvé.</p>}
      </div>
      <Dialog open={!!chatAgent} onOpenChange={() => setChatAgent(null)}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-3 border-b border-border shrink-0"><DialogTitle className="flex items-center gap-2">{chatAgent && <chatAgent.icon className="h-5 w-5 text-primary" />}{chatAgent?.name}</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {chatMessages.length === 0 && <div className="text-center py-12 text-muted-foreground"><Bot className="mx-auto h-10 w-10 mb-3 text-muted-foreground/40" /><p className="text-sm">Envoyez un message pour commencer.</p></div>}
            {chatMessages.map((msg, i) => <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}><p className="whitespace-pre-wrap">{msg.content}</p></div></div>)}
            {isStreaming && chatMessages[chatMessages.length - 1]?.role !== "assistant" && <div className="flex justify-start"><div className="bg-secondary rounded-xl px-4 py-2.5"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div></div>}
            <div ref={chatEndRef} />
          </div>
          <div className="px-6 pb-6 pt-3 border-t border-border shrink-0"><div className="flex gap-2"><Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Votre message..." onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()} disabled={isStreaming} /><Button onClick={sendMessage} disabled={isStreaming || !chatInput.trim()} size="icon">{isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button></div></div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!configAgent} onOpenChange={() => setConfigAgent(null)}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" /> {configAgent?.name}</DialogTitle></DialogHeader>{configAgent && <ConfigForm agent={configAgent} onSave={(u) => updateAgentConfig(configAgent.id, u)} />}</DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

const ConfigForm = ({ agent, onSave }: { agent: Agent; onSave: (u: Partial<Agent>) => void }) => {
  const [sp, setSp] = useState(agent.systemPrompt);
  const [model, setModel] = useState(agent.model);
  const [name, setName] = useState(agent.name);
  const [desc, setDesc] = useState(agent.description);
  return (
    <div className="space-y-4">
      <div className="space-y-2"><Label>Nom</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="space-y-2"><Label>Description</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
      <div className="space-y-2"><Label>Modèle IA</Label><Select value={model} onValueChange={setModel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{models.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Prompt système</Label><Textarea value={sp} onChange={(e) => setSp(e.target.value)} rows={6} className="text-xs" /></div>
      <Button className="w-full" onClick={() => onSave({ name, description: desc, systemPrompt: sp, model })}>Enregistrer</Button>
    </div>
  );
};

export default AIAgentsPage;
