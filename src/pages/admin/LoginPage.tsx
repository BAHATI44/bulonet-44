import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Adresse email invalide").max(255),
  password: z.string().min(8, "8 caractères minimum").max(128),
});

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Rate limiting
    if (Date.now() < lockUntil) {
      const secs = Math.ceil((lockUntil - Date.now()) / 1000);
      setError(`Trop de tentatives. Réessayez dans ${secs}s.`);
      return;
    }

    // Validate inputs
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    if (isSignUp) {
      const { error: err } = await signUp(result.data.email, result.data.password);
      setIsLoading(false);
      if (err) {
        setError("Erreur lors de la création du compte. Veuillez réessayer.");
      } else {
        // Auto-login after signup (auto-confirm is enabled)
        const { error: loginErr } = await signIn(result.data.email, result.data.password);
        if (!loginErr) navigate("/admin");
        else setError("Compte créé ! Connectez-vous.");
        setIsSignUp(false);
      }
    } else {
      const { error: err } = await signIn(result.data.email, result.data.password);
      setIsLoading(false);
      if (err) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          setLockUntil(Date.now() + LOCKOUT_MS);
          setAttempts(0);
          setError("Trop de tentatives. Compte verrouillé pour 60 secondes.");
        } else {
          setError(`Identifiants invalides. ${MAX_ATTEMPTS - newAttempts} tentative(s) restante(s).`);
        }
      } else {
        setAttempts(0);
        navigate("/admin");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <Zap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">BULONET Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignUp ? "Créez votre compte administrateur" : "Accédez au tableau de bord"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-card p-6 shadow-elevated space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bulonet.com"
              autoComplete="email"
              required
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                minLength={8}
                maxLength={128}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={isLoading || Date.now() < lockUntil}>
            <Lock className="h-4 w-4" />
            {isLoading ? "Vérification..." : isSignUp ? "Créer le compte" : "Se connecter"}
          </Button>

          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
            className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {isSignUp ? "Déjà un compte ? Se connecter" : "Première connexion ? Créer un compte"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Connexion sécurisée · Chiffrement E2E · Anti-brute-force
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
