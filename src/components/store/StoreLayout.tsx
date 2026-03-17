import { ReactNode } from "react";
import StoreHeader from "@/components/store/StoreHeader";
import { Zap } from "lucide-react";

const StoreLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <main>{children}</main>
      <footer className="border-t border-border py-8 mt-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Zap className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">BULONET</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 BULONET. Commerce international sécurisé.</p>
        </div>
      </footer>
    </div>
  );
};

export default StoreLayout;
