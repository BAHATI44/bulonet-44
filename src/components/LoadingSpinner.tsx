import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: number;
}

const LoadingSpinner = ({ fullScreen, size = 8 }: LoadingSpinnerProps) => {
  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className={`h-${size} w-${size} animate-spin text-primary`} style={{ width: size * 4, height: size * 4 }} />
          <p className="text-sm text-muted-foreground animate-pulse">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
};

export default LoadingSpinner;
