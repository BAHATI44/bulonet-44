import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import StoreLayout from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, Mail, AlertCircle, Eye, EyeOff, ArrowRight, ShoppingBag } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().trim().email("Adresse email invalide").max(255),
  password: z.string().min(8, "8 caractères minimum").max(128),
});

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = schema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    if (isLogin) {
      const { error: err } = await signIn(result.data.email, result.data.password);
      setLoading(false);
      if (err) {
        setError("Email ou mot de passe incorrect.");
      } else {
        toast.success("Bienvenue !");
        navigate("/store");
      }
    } else {
      const { error: err } = await signUp(result.data.email, result.data.password);
      setLoading(false);
      if (err) {
        setError("Erreur lors de l'inscription. Cet email est peut-être déjà utilisé.");
      } else {
        toast.success("Compte créé ! Vérifiez votre email pour confirmer votre inscription.");
        setIsLogin(true);
      }
    }
  };

  return (
    <StoreLayout>
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <User className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isLogin ? "Connexion" : "Créer un compte"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLogin ? "Connectez-vous pour suivre vos commandes" : "Rejoignez BULONET pour une expérience personnalisée"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl bg-card p-6 shadow-soft space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {isLogin ? "Se connecter" : "Créer mon compte"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Suivez vos commandes · Accès à votre historique</span>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
};

export default AuthPage;
