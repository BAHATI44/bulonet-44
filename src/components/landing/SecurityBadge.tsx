import { motion } from "framer-motion";
import { Shield } from "lucide-react";

const SecurityBadge = () => {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 shadow-soft text-sm font-medium text-foreground">
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="h-2 w-2 rounded-full bg-success"
      />
      <Shield className="h-3.5 w-3.5 text-primary" />
      <span className="text-muted-foreground">Connexion sécurisée</span>
    </div>
  );
};

export default SecurityBadge;
