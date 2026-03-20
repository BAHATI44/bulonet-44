import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => (
  <div className="flex min-h-screen items-center justify-center bg-background p-4">
    <div className="max-w-md text-center space-y-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-xl font-bold text-foreground">Une erreur est survenue</h1>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={resetErrorBoundary}>Réessayer</Button>
    </div>
  </div>
);

export default ErrorFallback;
