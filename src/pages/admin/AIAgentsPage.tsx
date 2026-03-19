import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Bot, Brain, TrendingUp, ShoppingCart, MessageSquare, Eye, PenTool,
  Globe, AlertTriangle, Cog, Heart, Tags, UserPlus, Star, CheckCircle,
  Sparkles, FolderTree, Trash2, MessageCircle, Shield, Gavel,
  DollarSign, Megaphone, BarChart3, Search, Compass, Users,
  Handshake, ClipboardList, Calculator, PackageSearch, Warehouse,
  Truck, Package, MapPin, Bell, RotateCcw, Scale, Receipt,
  Building, Navigation, Boxes, ArrowDownUp, Zap, Activity,
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
}

const agentCategories = [
  { key: "ia-core", label: "🧠 IA & Machine Learning", color: "bg-violet-500/10 text-violet-400" },
  { key: "marketplace", label: "🛒 Marketplace & Vendeurs", color: "bg-blue-500/10 text-blue-400" },
  { key: "sourcing", label: "🔍 Sourcing & Approvisionnement", color: "bg-amber-500/10 text-amber-400" },
  { key: "logistique", label: "📦 Logistique & Livraison", color: "bg-emerald-500/10 text-emerald-400" },
];

const allAgents: AIAgent[] = [
  // IA & ML
  { id: "gen-agent", name: "Générateur d'Agents", description: "Crée de nouveaux agents IA à partir de templates, génère des scripts et assure leur intégration.", capabilities: ["Génération de scripts", "Tests automatisés", "Intégration"], icon: Bot, category: "ia-core", status: "active" },
  { id: "optim-model", name: "Optimisation des Modèles", description: "Améliore les performances des modèles ML, ajuste les hyperparamètres et réduit la latence.", capabilities: ["Hyperparamètres", "Latence", "Versioning"], icon: Brain, category: "ia-core", status: "active" },
  { id: "pred-sales", name: "Prédiction des Ventes", description: "Anticipe les volumes de vente avec des séries temporelles et facteurs saisonniers.", capabilities: ["Séries temporelles", "Saisonnalité", "Intervalles de confiance"], icon: TrendingUp, category: "ia-core", status: "active" },
  { id: "reco-prod", name: "Recommandation Produits", description: "Suggère des produits personnalisés via collaborative filtering et analyse comportementale.", capabilities: ["Historique d'achat", "Temps réel", "A/B testing"], icon: ShoppingCart, category: "ia-core", status: "active" },
  { id: "nlp", name: "Traitement du Langage Naturel", description: "Analyse les avis clients, extrait les sentiments et identifie les sujets récurrents.", capabilities: ["Sentiment analysis", "Topic detection", "Résumés"], icon: MessageSquare, category: "ia-core", status: "active" },
  { id: "vision", name: "Vision par Ordinateur", description: "Analyse les images produits, détecte les défauts et génère des descriptions.", capabilities: ["Détection d'objets", "Classification", "Descriptions"], icon: Eye, category: "ia-core", status: "standby" },
  { id: "content-gen", name: "Génération de Contenu", description: "Rédige des descriptions produits et articles optimisés SEO.", capabilities: ["Descriptions", "Blog", "SEO"], icon: PenTool, category: "ia-core", status: "active" },
  { id: "chatbot", name: "Chatbot Multilingue", description: "Répond aux questions clients en plusieurs langues avec escalade humaine.", capabilities: ["Multi-langues", "Intentions", "Escalade"], icon: Globe, category: "ia-core", status: "active" },
  { id: "anomaly", name: "Détection d'Anomalies", description: "Repère les comportements inhabituels dans les transactions et logs.", capabilities: ["Monitoring", "Alertes", "Apprentissage continu"], icon: AlertTriangle, category: "ia-core", status: "active" },
  { id: "rpa", name: "Automatisation des Processus", description: "Automatise les tâches répétitives et crée des workflows RPA.", capabilities: ["Identification", "Workflows", "Monitoring"], icon: Cog, category: "ia-core", status: "standby" },
  { id: "sentiment", name: "Analyse des Sentiments", description: "Détecte les émotions dans les avis et génère des alertes pour les avis négatifs.", capabilities: ["Émotions", "Corrélation notes", "Alertes"], icon: Heart, category: "ia-core", status: "active" },
  { id: "classif", name: "Classification Automatique", description: "Classe les produits dans les bonnes catégories via contenu et images.", capabilities: ["Auto-classification", "Taxonomie", "Mise à jour"], icon: Tags, category: "ia-core", status: "active" },

  // Marketplace
  { id: "onboard-seller", name: "Onboarding Vendeurs", description: "Accompagne les nouveaux vendeurs dans leur inscription et création de boutique.", capabilities: ["Vérification docs", "Guide boutique", "Rappels"], icon: UserPlus, category: "marketplace", status: "active" },
  { id: "score-seller", name: "Scoring Vendeurs", description: "Évalue la fiabilité et performance des vendeurs avec un score de confiance.", capabilities: ["Délais", "Qualité", "Classement"], icon: Star, category: "marketplace", status: "active" },
  { id: "valid-prod", name: "Validation Produits", description: "Vérifie la conformité des annonces et détecte les produits interdits.", capabilities: ["Images", "Descriptions", "Auto-approbation"], icon: CheckCircle, category: "marketplace", status: "active" },
  { id: "improve-listing", name: "Amélioration Fiches Produits", description: "Optimise les descriptions, titres et mots-clés SEO des fiches.", capabilities: ["SEO", "Orthographe", "Attributs"], icon: Sparkles, category: "marketplace", status: "active" },
  { id: "auto-categ", name: "Catégorisation Automatique", description: "Place les produits dans la bonne catégorie avec suggestions.", capabilities: ["Catégorie principale", "Secondaire", "Tendances"], icon: FolderTree, category: "marketplace", status: "standby" },
  { id: "data-clean", name: "Nettoyage des Données", description: "Élimine les doublons et incohérences dans le catalogue.", capabilities: ["Doublons", "Formats", "Annonces obsolètes"], icon: Trash2, category: "marketplace", status: "active" },
  { id: "review-mgmt", name: "Gestion des Avis", description: "Modère les avis, filtre le spam et répond automatiquement.", capabilities: ["Modération", "Mise en avant", "Réponses auto"], icon: MessageCircle, category: "marketplace", status: "active" },
  { id: "counterfeit", name: "Détection de Contrefaçons", description: "Identifie les produits suspects et analyse les logos copiés.", capabilities: ["Base marques", "Analyse images", "Alertes légales"], icon: Shield, category: "marketplace", status: "active" },
  { id: "seller-claims", name: "Réclamations Vendeurs", description: "Traite les litiges et propose des solutions standardisées.", capabilities: ["Analyse", "Solutions", "Escalade"], icon: Gavel, category: "marketplace", status: "standby" },
  { id: "commission", name: "Optimisation Commissions", description: "Calcule les frais optimaux et simule différents barèmes.", capabilities: ["Simulation", "Ajustements", "Concurrence"], icon: DollarSign, category: "marketplace", status: "active" },
  { id: "promos", name: "Gestion des Promotions", description: "Crée des campagnes promotionnelles et suit les performances.", capabilities: ["Sélection produits", "Réductions", "Suivi"], icon: Megaphone, category: "marketplace", status: "active" },
  { id: "seller-sat", name: "Satisfaction Vendeurs", description: "Mesure le bien-être des vendeurs via enquêtes et rétention.", capabilities: ["Enquêtes", "Rétention", "Améliorations"], icon: BarChart3, category: "marketplace", status: "standby" },

  // Sourcing
  { id: "scraper", name: "Scraping AliExpress/Amazon", description: "Extrait les données produits des sites fournisseurs et met à jour quotidiennement.", capabilities: ["Prix", "Images", "Anti-bot"], icon: Search, category: "sourcing", status: "active" },
  { id: "trends", name: "Détection de Tendances", description: "Identifie les produits émergents via réseaux sociaux et recherches.", capabilities: ["Analyse sociale", "Prédictions", "Rapports"], icon: Compass, category: "sourcing", status: "active" },
  { id: "supplier-cmp", name: "Comparateur Fournisseurs", description: "Compare prix, délais et fiabilité des fournisseurs.", capabilities: ["Prix", "Délais", "Coût total"], icon: Users, category: "sourcing", status: "active" },
  { id: "negotiate", name: "Négociation Automatisée", description: "Obtient de meilleurs prix via des demandes de devis automatisées.", capabilities: ["Devis", "Analyse", "Contre-offres"], icon: Handshake, category: "sourcing", status: "standby" },
  { id: "supplier-orders", name: "Commandes Fournisseurs", description: "Passe et suit les commandes, vérifie les délais et relance.", capabilities: ["Bons de commande", "Suivi", "Relance"], icon: ClipboardList, category: "sourcing", status: "active" },
  { id: "import-costs", name: "Analyse Coûts d'Import", description: "Calcule droits de douane, taxes et frais de transport.", capabilities: ["Codes HS", "Tarifs", "Transport"], icon: Calculator, category: "sourcing", status: "active" },
  { id: "supplier-stock", name: "Rupture Fournisseur", description: "Surveille les stocks fournisseurs et suggère des alternatives.", capabilities: ["Scan pages", "Alertes", "Alternatives"], icon: PackageSearch, category: "sourcing", status: "active" },
  { id: "supplier-quality", name: "Qualité Fournisseur", description: "Analyse les retours qualité et calcule un score par fournisseur.", capabilities: ["Avis croisés", "Score", "Base fournisseurs"], icon: Activity, category: "sourcing", status: "standby" },
  { id: "batch-optim", name: "Optimisation Lots d'Achat", description: "Suggère des quantités d'achat optimales selon les prévisions.", capabilities: ["Prévisions", "Coûts stockage", "Délais"], icon: Boxes, category: "sourcing", status: "active" },

  // Logistique
  { id: "route-optim", name: "Optimisation Itinéraires", description: "Calcule les trajets de livraison les plus efficaces en temps réel.", capabilities: ["Trafic", "Météo", "Temps réel"], icon: Navigation, category: "logistique", status: "active" },
  { id: "tracking", name: "Suivi des Colis", description: "Informe les clients via notifications push et gère les exceptions.", capabilities: ["Statuts", "Notifications", "Exceptions"], icon: Truck, category: "logistique", status: "active" },
  { id: "stock-mgmt", name: "Gestion des Stocks", description: "Optimise les niveaux de stock et propose des réapprovisionnements.", capabilities: ["Réappro", "Anti-rupture", "Inventaires"], icon: Warehouse, category: "logistique", status: "active" },
  { id: "stockout-pred", name: "Prévision des Ruptures", description: "Anticipe les ruptures de stock et suggère des commandes urgentes.", capabilities: ["Analyse ventes", "Alertes", "Commandes urgentes"], icon: AlertTriangle, category: "logistique", status: "active" },
  { id: "returns", name: "Gestion des Retours", description: "Automatise le processus de retour et déclenche les remboursements.", capabilities: ["Étiquettes", "Suivi", "Remboursements"], icon: RotateCcw, category: "logistique", status: "standby" },
  { id: "carrier-select", name: "Choix du Transporteur", description: "Sélectionne le meilleur transporteur selon tarifs et contraintes.", capabilities: ["Comparaison", "Contraintes", "Contrats"], icon: Scale, category: "logistique", status: "active" },
  { id: "shipping-calc", name: "Calcul Frais de Port", description: "Calcule dynamiquement les frais selon poids, destination et options.", capabilities: ["Poids", "Options", "Gratuité"], icon: Receipt, category: "logistique", status: "active" },
  { id: "warehouse-plan", name: "Planification Entrepôts", description: "Organise l'espace de stockage et optimise les emplacements.", capabilities: ["Fast-movers", "Allées", "Simulations"], icon: Building, category: "logistique", status: "standby" },
  { id: "intl-orders", name: "Commandes Internationales", description: "Gère les formalités douanières et le suivi international.", capabilities: ["Documents", "Droits", "Suivi global"], icon: MapPin, category: "logistique", status: "active" },
  { id: "lost-pkg", name: "Détection Colis Perdus", description: "Identifie les colis en souffrance et déclenche des enquêtes.", capabilities: ["Tracking", "Alertes", "Enquêtes"], icon: Bell, category: "logistique", status: "active" },
  { id: "carrier-eval", name: "Évaluation Transporteurs", description: "Note les transporteurs selon délais, casse et satisfaction.", capabilities: ["Mesures", "Contrats", "Suggestions"], icon: ArrowDownUp, category: "logistique", status: "standby" },
];

const AIAgentsPage = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [agents, setAgents] = useState(allAgents);

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
  const standbyCount = agents.filter((a) => a.status === "standby").length;

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
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs text-amber-400">En veille</p>
          <p className="text-2xl font-bold text-amber-400">{standbyCount}</p>
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
          <Button
            size="sm"
            variant={!activeCategory ? "default" : "outline"}
            onClick={() => setActiveCategory(null)}
          >
            Tous
          </Button>
          {agentCategories.map((c) => (
            <Button
              key={c.key}
              size="sm"
              variant={activeCategory === c.key ? "default" : "outline"}
              onClick={() => setActiveCategory(c.key)}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Agent Grid */}
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
                  <Badge variant="outline" className={`mt-1 text-[10px] ${statusColor(agent.status)}`}>
                    {statusLabel(agent.status)}
                  </Badge>
                </div>
              </div>
              <Switch
                checked={agent.status === "active"}
                onCheckedChange={() => toggleAgent(agent.id)}
              />
            </div>
            <p className="mb-3 text-xs text-muted-foreground leading-relaxed">{agent.description}</p>
            <div className="flex flex-wrap gap-1">
              {agent.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <Zap className="mx-auto mb-3 h-8 w-8 opacity-30" />
          <p>Aucun agent trouvé</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default AIAgentsPage;
