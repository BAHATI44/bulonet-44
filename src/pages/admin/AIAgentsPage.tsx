import { useState, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Bot, Brain, TrendingUp, ShoppingCart, MessageSquare, Eye, PenTool,
  Globe, AlertTriangle, Cog, Heart, Tags, UserPlus, Star, CheckCircle,
  Sparkles, FolderTree, Trash2, MessageCircle, Shield, Gavel,
  DollarSign, Megaphone, BarChart3, Search, Compass, Users,
  Handshake, ClipboardList, Calculator, PackageSearch, Warehouse,
  Truck, Package, MapPin, Bell, RotateCcw, Scale, Receipt,
  Building, Navigation, Boxes, ArrowDownUp, Zap, Activity,
  Send, Loader2, X,
} from "lucide-react";
import { toast } from "sonner";

interface AIAgent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  icon: React.ElementType;
  category: string;
  status: "active" | "standby" | "disabled";
  aiEnabled: boolean;
}

const agentCategories = [
  { key: "ia-core", label: "🧠 IA & ML", color: "bg-violet-500/10 text-violet-400" },
  { key: "marketplace", label: "🛒 Marketplace", color: "bg-blue-500/10 text-blue-400" },
  { key: "sourcing", label: "🔍 Sourcing", color: "bg-amber-500/10 text-amber-400" },
  { key: "logistique", label: "📦 Logistique", color: "bg-emerald-500/10 text-emerald-400" },
];

const AI_ENABLED_AGENTS = [
  "content-gen", "pred-sales", "reco-prod", "nlp", "sentiment", "chatbot",
  "classif", "improve-listing", "valid-prod", "trends", "anomaly", "data-clean",
];

const allAgentsData: Omit<AIAgent, "aiEnabled">[] = [
  { id: "gen-agent", name: "Générateur d'Agents", description: "Crée de nouveaux agents IA à partir de templates.", capabilities: ["Génération de scripts", "Tests", "Intégration"], icon: Bot, category: "ia-core", status: "active" },
  { id: "optim-model", name: "Optimisation des Modèles", description: "Améliore les performances des modèles ML.", capabilities: ["Hyperparamètres", "Latence", "Versioning"], icon: Brain, category: "ia-core", status: "active" },
  { id: "pred-sales", name: "Prédiction des Ventes", description: "Anticipe les volumes de vente par produit/catégorie.", capabilities: ["Séries temporelles", "Saisonnalité", "Confiance"], icon: TrendingUp, category: "ia-core", status: "active" },
  { id: "reco-prod", name: "Recommandation Produits", description: "Suggère des produits personnalisés aux clients.", capabilities: ["Historique", "Temps réel", "A/B testing"], icon: ShoppingCart, category: "ia-core", status: "active" },
  { id: "nlp", name: "Traitement du Langage Naturel", description: "Analyse les avis et commentaires clients.", capabilities: ["Sentiments", "Topics", "Résumés"], icon: MessageSquare, category: "ia-core", status: "active" },
  { id: "vision", name: "Vision par Ordinateur", description: "Analyse les images de produits.", capabilities: ["Détection", "Classification", "Descriptions"], icon: Eye, category: "ia-core", status: "standby" },
  { id: "content-gen", name: "Génération de Contenu", description: "Rédige des descriptions produits optimisées SEO.", capabilities: ["Descriptions", "Blog", "SEO"], icon: PenTool, category: "ia-core", status: "active" },
  { id: "chatbot", name: "Chatbot Multilingue", description: "Répond aux questions clients en plusieurs langues.", capabilities: ["Multi-langues", "Intentions", "Escalade"], icon: Globe, category: "ia-core", status: "active" },
  { id: "anomaly", name: "Détection d'Anomalies", description: "Repère les comportements inhabituels.", capabilities: ["Monitoring", "Alertes", "Apprentissage"], icon: AlertTriangle, category: "ia-core", status: "active" },
  { id: "rpa", name: "Automatisation Processus", description: "Automatise les tâches répétitives.", capabilities: ["Identification", "Workflows", "Monitoring"], icon: Cog, category: "ia-core", status: "standby" },
  { id: "sentiment", name: "Analyse des Sentiments", description: "Détecte les émotions dans les avis.", capabilities: ["Émotions", "Corrélation", "Alertes"], icon: Heart, category: "ia-core", status: "active" },
  { id: "classif", name: "Classification Automatique", description: "Classe les produits dans les bonnes catégories.", capabilities: ["Auto-classification", "Taxonomie", "MàJ"], icon: Tags, category: "ia-core", status: "active" },
  { id: "onboard-seller", name: "Onboarding Vendeurs", description: "Accompagne les nouveaux vendeurs.", capabilities: ["Vérification", "Guide", "Rappels"], icon: UserPlus, category: "marketplace", status: "active" },
  { id: "score-seller", name: "Scoring Vendeurs", description: "Évalue la fiabilité des vendeurs.", capabilities: ["Délais", "Qualité", "Classement"], icon: Star, category: "marketplace", status: "active" },
  { id: "valid-prod", name: "Validation Produits", description: "Vérifie la conformité des annonces.", capabilities: ["Images", "Descriptions", "Auto-approbation"], icon: CheckCircle, category: "marketplace", status: "active" },
  { id: "improve-listing", name: "Amélioration Fiches", description: "Optimise descriptions et titres SEO.", capabilities: ["SEO", "Orthographe", "Attributs"], icon: Sparkles, category: "marketplace", status: "active" },
  { id: "auto-categ", name: "Catégorisation Auto", description: "Place les produits dans la bonne catégorie.", capabilities: ["Principale", "Secondaire", "Tendances"], icon: FolderTree, category: "marketplace", status: "standby" },
  { id: "data-clean", name: "Nettoyage Données", description: "Élimine doublons et incohérences.", capabilities: ["Doublons", "Formats", "Obsolètes"], icon: Trash2, category: "marketplace", status: "active" },
  { id: "review-mgmt", name: "Gestion des Avis", description: "Modère et analyse les avis clients.", capabilities: ["Modération", "Mise en avant", "Réponses"], icon: MessageCircle, category: "marketplace", status: "active" },
  { id: "counterfeit", name: "Détection Contrefaçons", description: "Identifie les produits suspects.", capabilities: ["Base marques", "Images", "Alertes"], icon: Shield, category: "marketplace", status: "active" },
  { id: "seller-claims", name: "Réclamations Vendeurs", description: "Traite les litiges vendeurs.", capabilities: ["Analyse", "Solutions", "Escalade"], icon: Gavel, category: "marketplace", status: "standby" },
  { id: "commission", name: "Optimisation Commissions", description: "Calcule les frais optimaux.", capabilities: ["Simulation", "Ajustements", "Concurrence"], icon: DollarSign, category: "marketplace", status: "active" },
  { id: "promos", name: "Gestion Promotions", description: "Crée et gère les campagnes.", capabilities: ["Sélection", "Réductions", "Suivi"], icon: Megaphone, category: "marketplace", status: "active" },
  { id: "seller-sat", name: "Satisfaction Vendeurs", description: "Mesure le bien-être des vendeurs.", capabilities: ["Enquêtes", "Rétention", "Améliorations"], icon: BarChart3, category: "marketplace", status: "standby" },
  { id: "scraper", name: "Scraping AliExpress/Amazon", description: "Extrait les données produits des fournisseurs.", capabilities: ["Prix", "Images", "Anti-bot"], icon: Search, category: "sourcing", status: "active" },
  { id: "trends", name: "Détection de Tendances", description: "Identifie les produits émergents.", capabilities: ["Analyse", "Prédictions", "Rapports"], icon: Compass, category: "sourcing", status: "active" },
  { id: "supplier-cmp", name: "Comparateur Fournisseurs", description: "Compare les offres fournisseurs.", capabilities: ["Prix", "Délais", "Coût total"], icon: Users, category: "sourcing", status: "active" },
  { id: "negotiate", name: "Négociation Auto", description: "Obtient de meilleurs prix.", capabilities: ["Devis", "Analyse", "Contre-offres"], icon: Handshake, category: "sourcing", status: "standby" },
  { id: "supplier-orders", name: "Commandes Fournisseurs", description: "Passe et suit les commandes.", capabilities: ["Bons", "Suivi", "Relance"], icon: ClipboardList, category: "sourcing", status: "active" },
  { id: "import-costs", name: "Coûts d'Import", description: "Calcule droits de douane et taxes.", capabilities: ["Codes HS", "Tarifs", "Transport"], icon: Calculator, category: "sourcing", status: "active" },
  { id: "supplier-stock", name: "Rupture Fournisseur", description: "Surveille les stocks fournisseurs.", capabilities: ["Scan", "Alertes", "Alternatives"], icon: PackageSearch, category: "sourcing", status: "active" },
  { id: "supplier-quality", name: "Qualité Fournisseur", description: "Analyse les retours qualité.", capabilities: ["Avis", "Score", "Base"], icon: Activity, category: "sourcing", status: "standby" },
  { id: "batch-optim", name: "Optimisation Lots", description: "Suggère des quantités optimales.", capabilities: ["Prévisions", "Coûts", "Délais"], icon: Boxes, category: "sourcing", status: "active" },
  { id: "route-optim", name: "Optimisation Itinéraires", description: "Calcule les meilleurs trajets.", capabilities: ["Trafic", "Météo", "Temps réel"], icon: Navigation, category: "logistique", status: "active" },
  { id: "tracking", name: "Suivi des Colis", description: "Informe les clients en temps réel.", capabilities: ["Statuts", "Notifications", "Exceptions"], icon: Truck, category: "logistique", status: "active" },
  { id: "stock-mgmt", name: "Gestion des Stocks", description: "Optimise les niveaux de stock.", capabilities: ["Réappro", "Anti-rupture", "Inventaires"], icon: Warehouse, category: "logistique", status: "active" },
  { id: "stockout-pred", name: "Prévision Ruptures", description: "Anticipe les ruptures de stock.", capabilities: ["Analyse", "Alertes", "Urgences"], icon: AlertTriangle, category: "logistique", status: "active" },
  { id: "returns", name: "Gestion Retours", description: "Automatise les retours.", capabilities: ["Étiquettes", "Suivi", "Remboursements"], icon: RotateCcw, category: "logistique", status: "standby" },
  { id: "carrier-select", name: "Choix Transporteur", description: "Sélectionne le meilleur transporteur.", capabilities: ["Comparaison", "Contraintes", "Contrats"], icon: Scale, category: "logistique", status: "active" },
  { id: "shipping-calc", name: "Calcul Frais de Port", description: "Calcule dynamiquement les frais.", capabilities: ["Poids", "Options", "Gratuité"], icon: Receipt, category: "logistique", status: "active" },
  { id: "warehouse-plan", name: "Planification Entrepôts", description: "Organise l'espace de stockage.", capabilities: ["Fast-movers", "Allées", "Simulations"], icon: Building, category: "logistique", status: "standby" },
  { id: "intl-orders", name: "Commandes Internationales", description: "Gère les formalités douanières.", capabilities: ["Documents", "Droits", "Suivi global"], icon: MapPin, category: "logistique", status: "active" },
  { id: "lost-pkg", name: "Colis Perdus", description: "Identifie les colis en souffrance.", capabilities: ["Tracking", "Alertes", "Enquêtes"], icon: Bell, category: "logistique", status: "active" },
  { id: "carrier-eval", name: "Évaluation Transporteurs", description: "Note les transporteurs.", capabilities: ["Mesures", "Contrats", "Suggestions"], icon: ArrowDownUp, category: "logistique", status: "standby" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent`;

const AIAgentsPage = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [agents, setAgents] = useState<AIAgent[]>(
    allAgentsData.map((a) => ({ ...a, aiEnabled: AI_ENABLED_AGENTS.includes(a.id) }))
  );
  const [chatAgent, setChatAgent] = useState<AIAgent | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const filtered = agents.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || a.category === activeCategory;
    return matchSearch && matchCat;
  });

  const toggleAgent = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const next = a.status === "active" ? "disabled" : "active";
        toast.success(`${a.name} ${next === "active" ? "activé" : "désactivé"}`);
        return { ...a, status: next };
      })
    );
  };

  const openChat = (agent: AIAgent) => {
    setChatAgent(agent);
    setChatMessages([]);
    setChatInput("");
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !chatAgent || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const newMessages = [...chatMessages, { role: "user" as const, content: userMsg }];
    setChatMessages(newMessages);
    setChatLoading(true);

    let assistantContent = "";
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setChatMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          agentId: chatAgent.id,
          message: userMsg,
        }),
      });

      if (resp.status === 429) {
        toast.error("Limite de requêtes atteinte, réessayez plus tard.");
        setChatLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("Crédits IA insuffisants.");
        setChatLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Erreur du service IA");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      toast.error("Erreur lors de la communication avec l'agent IA.");
      console.error(e);
    }

    setChatLoading(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const statusColor = (s: string) => {
    if (s === "active") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (s === "standby") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    return "bg-muted text-muted-foreground border-border";
  };

  const statusLabel = (s: string) => {
    if (s === "active") return "Actif";
    if (s === "standby") return "En veille";
    return "Désactivé";
  };

  const activeCount = agents.filter((a) => a.status === "active").length;
  const aiCount = agents.filter((a) => a.aiEnabled).length;

  return (
    <AdminLayout title="Agents IA">
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total agents</p>
          <p className="text-2xl font-bold text-card-foreground">{agents.length}</p>
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs text-emerald-400">Actifs</p>
          <p className="text-2xl font-bold text-emerald-400">{activeCount}</p>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs text-primary">IA connectée</p>
          <p className="text-2xl font-bold text-primary">{aiCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Catégories</p>
          <p className="text-2xl font-bold text-card-foreground">{agentCategories.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Rechercher un agent…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={!activeCategory ? "default" : "outline"} onClick={() => setActiveCategory(null)}>
            Tous
          </Button>
          {agentCategories.map((c) => (
            <Button key={c.key} size="sm" variant={activeCategory === c.key ? "default" : "outline"} onClick={() => setActiveCategory(c.key)}>
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((agent) => (
          <div
            key={agent.id}
            className="group relative rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <agent.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground leading-tight">{agent.name}</h3>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge variant="outline" className={`text-[10px] ${statusColor(agent.status)}`}>
                      {statusLabel(agent.status)}
                    </Badge>
                    {agent.aiEnabled && (
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                        ⚡ IA
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Switch checked={agent.status === "active"} onCheckedChange={() => toggleAgent(agent.id)} />
            </div>
            <p className="mb-3 text-xs text-muted-foreground leading-relaxed">{agent.description}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {agent.capabilities.map((cap) => (
                <span key={cap} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {cap}
                </span>
              ))}
            </div>
            {agent.aiEnabled && agent.status === "active" && (
              <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs" onClick={() => openChat(agent)}>
                <MessageSquare className="h-3.5 w-3.5" />
                Tester l'agent
              </Button>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <Zap className="mx-auto mb-3 h-8 w-8 opacity-30" />
          <p>Aucun agent trouvé</p>
        </div>
      )}

      {/* Chat Dialog */}
      <Dialog open={!!chatAgent} onOpenChange={(open) => !open && setChatAgent(null)}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-3">
              {chatAgent && (
                <>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <chatAgent.icon className="h-4 w-4 text-primary" />
                  </div>
                  {chatAgent.name}
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                    ⚡ Lovable AI
                  </Badge>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-12">
                <Bot className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p>Envoyez un message pour tester cet agent IA.</p>
                <p className="mt-1 text-xs">L'agent utilise Lovable AI pour répondre.</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {chatLoading && chatMessages[chatMessages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-secondary px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border px-6 py-4">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="flex gap-2"
            >
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Tapez votre message..."
                className="flex-1"
                disabled={chatLoading}
              />
              <Button type="submit" size="icon" disabled={chatLoading || !chatInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AIAgentsPage;
