import { motion } from "framer-motion";

interface MarketCardProps {
  flag: string;
  country: string;
  currency: string;
  currencyCode: string;
  payments: string[];
  index: number;
}

const MarketCard = ({ flag, country, currency, currencyCode, payments, index }: MarketCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2 }}
      className="rounded-lg bg-card p-5 shadow-soft transition-shadow duration-300 hover:shadow-elevated"
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{flag}</span>
        <div>
          <p className="font-semibold text-card-foreground">{country}</p>
          <p className="text-sm font-mono text-muted-foreground">{currencyCode} · {currency}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {payments.map((p) => (
          <span key={p} className="rounded-sm bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {p}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

export default MarketCard;
