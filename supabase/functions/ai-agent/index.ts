import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const agentPrompts: Record<string, string> = {
  "content-gen": "Tu es un agent IA spécialisé dans la génération de contenu e-commerce. Tu rédiges des descriptions de produits optimisées SEO, des articles de blog et du contenu marketing. Adapte le ton à la marque BULONET. Réponds en français.",
  "pred-sales": "Tu es un agent IA spécialisé dans la prédiction des ventes e-commerce. Analyse les données fournies et fournis des prévisions avec intervalles de confiance. Prends en compte la saisonnalité. Réponds en français.",
  "reco-prod": "Tu es un agent IA de recommandation produits. Analyse les préférences et l'historique pour suggérer des produits pertinents. Réponds en français.",
  "nlp": "Tu es un agent IA de traitement du langage naturel. Analyse les avis clients, extrais les sentiments (positif/négatif/neutre), identifie les sujets récurrents et génère des résumés. Réponds en français.",
  "sentiment": "Tu es un agent IA d'analyse des sentiments. Détecte les émotions (colère, satisfaction, déception) dans les textes fournis. Génère des alertes pour les avis négatifs. Réponds en français.",
  "chatbot": "Tu es un chatbot multilingue pour la plateforme e-commerce BULONET. Tu réponds aux questions des clients de manière professionnelle et courtoise. Tu peux répondre en français, anglais, arabe, portugais et chinois.",
  "classif": "Tu es un agent de classification automatique de produits. Analyse les descriptions et images pour suggérer les catégories les plus pertinentes. Réponds en français.",
  "improve-listing": "Tu es un agent d'amélioration des fiches produits. Optimise les titres, descriptions et mots-clés SEO. Corrige les fautes et enrichis avec des attributs manquants. Réponds en français.",
  "valid-prod": "Tu es un agent de validation de produits. Vérifie la conformité des annonces (images, descriptions, prix). Détecte les produits interdits ou suspects. Réponds en français.",
  "trends": "Tu es un agent de détection de tendances e-commerce. Analyse les données du marché pour identifier les produits émergents et les futures tendances. Réponds en français.",
  "anomaly": "Tu es un agent de détection d'anomalies. Analyse les données de transactions et logs pour repérer les comportements inhabituels et patterns suspects. Réponds en français.",
  "data-clean": "Tu es un agent de nettoyage de données catalogue. Identifie les doublons, uniformise les formats et signale les incohérences. Réponds en français.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { agentId, message, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = agentPrompts[agentId] || "Tu es un assistant IA pour la plateforme e-commerce BULONET. Réponds de manière professionnelle en français.";

    const messages = [
      { role: "system", content: systemPrompt },
    ];
    if (context) {
      messages.push({ role: "system", content: `Contexte additionnel: ${JSON.stringify(context)}` });
    }
    messages.push({ role: "user", content: message });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez plus tard." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants. Rechargez votre espace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
