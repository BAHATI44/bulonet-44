// ======================================================
// Fichier     : src/components/landing/ExchangeRateRow.tsx
// Projet      : Bulonet 🚀
// Description : Affiche une ligne de taux de change avec
//               indication de variation (positive/négative).
//               Utilisé dans la section des taux en direct.
//               Intègre des icônes de tendance, un formatage
//               automatique, et des attributs d'accessibilité.
// ======================================================

import { memo } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExchangeRateRowProps {
  /** Code de la devise source (ex: "USD") */
  from: string;
  /** Code de la devise cible (ex: "EUR") */
  to: string;
  /** Taux de change formaté (ex: "1.2345") */
  rate: string | number;
  /** Variation en pourcentage ou valeur (ex: "+0.15%") */
  change: string;
  /** Indique si la variation est positive (true) ou négative (false) */
  positive: boolean;
  /** Optionnel : nombre de décimales à afficher (par défaut 4) */
  decimals?: number;
}

/**
 * Affiche une ligne de taux de change avec variation.
 * - Le taux est formaté avec le bon nombre de décimales.
 * - La variation est accompagnée d'une flèche colorée.
 * - Accessible via des attributs ARIA.
 */
const ExchangeRateRow = memo(
  ({ from, to, rate, change, positive, decimals = 4 }: ExchangeRateRowProps) => {
    // Formatage du taux en nombre si c'est une chaîne
    const numericRate = typeof rate === "string" ? parseFloat(rate) : rate;
    const formattedRate = numericRate.toFixed(decimals);

    // Extraire le signe de la variation si présent
    const changeValue = change.startsWith("+") || change.startsWith("-") ? change : `${positive ? "+" : "-"}${change}`;

    return (
      <div
        className="flex items-center justify-between border-b border-dashed border-border py-3 last:border-0"
        role="row"
        aria-label={`Taux ${from}/${to} : ${formattedRate}`}
      >
        {/* Paire de devises */}
        <span className="text-sm font-medium text-foreground">
          {from}/{to}
        </span>

        {/* Taux et variation */}
        <div className="flex items-center gap-3">
          {/* Taux formaté */}
          <span className="font-mono text-sm tabular-nums text-foreground">
            {formattedRate}
          </span>

          {/* Variation avec icône */}
          <div
            className={cn(
              "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
              positive
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            )}
            aria-label={`Variation ${positive ? "positive" : "négative"} de ${changeValue}`}
          >
            {positive ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            <span className="tabular-nums">{changeValue}</span>
          </div>
        </div>
      </div>
    );
  }
);

ExchangeRateRow.displayName = "ExchangeRateRow";

export default ExchangeRateRow;

// ====================================================
// 💡 CONSEILS & ORIENTATIONS
// ====================================================
// - Ce composant est utilisé dans la section "Taux de change en direct"
//   de la page d'accueil. Il reçoit ses données du parent (ex: données statiques
//   ou issues d'une API). Pour des données réelles, vous pouvez intégrer une
//   requête React Query dans le parent.
// - La prop `decimals` permet d'ajuster le nombre de décimales selon la devise
//   (ex: les crypto ont souvent 8 décimales).
// - L'icône de flèche améliore la lisibilité pour les utilisateurs daltoniens.
// - Le composant est mémoïsé (`memo`) pour éviter des re-rendus inutiles.
// - Pensez à importer les icônes depuis `lucide-react`.
// - Les classes `bg-success/10` et `text-success` utilisent les variables CSS
//   définies dans `index.css`. Assurez-vous que ces couleurs existent.
// ====================================================
