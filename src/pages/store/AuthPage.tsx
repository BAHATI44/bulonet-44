// ======================================================
// Fichier     : src/pages/store/AuthPage.tsx
// Projet      : Bulonet 🚀
// Description : Page d'authentification (connexion / inscription)
//               avec formulaire géré par react-hook-form,
//               validation Zod, feedback en temps réel,
//               liens de récupération de mot de passe,
//               indicateur de force du mot de passe,
//               gestion des erreurs Supabase,
//               et redirection après connexion.
// ======================================================

import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import StoreLayout from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  User,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ====================================================
// 1. SCHÉMAS DE VALIDATION (Zod)
// ====================================================

const loginSchema = z.object({
  email: z.string().trim().email("Adresse email invalide").max(255),
  password: z.string().min(1, "Mot de passe requis").max(128),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z
  .object({
    email: z.string().trim().email("Adresse email invalide").max(255),
    password: z
      .string()
      .min(8, "8 caractères minimum")
      .max(128)
      .regex(/[A-Z]/, "Doit contenir une majuscule")
      .regex(/[0-9]/, "Doit contenir un chiffre")
      .regex(/[^A-Za-z0-9]/, "Doit contenir un caractère spécial"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

// ====================================================
// 2. COMPOSANT D'INDICATEUR DE FORCE DU MOT DE PASSE
// ====================================================

const PasswordStrengthMeter = ({ password }: { password: string }) => {
  const calculateStrength = (pwd: string): number => {
    let score = 0;
    if (!pwd) return 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return Math.min(score, 4);
  };

  const strength = calculateStrength(password);
  const labels = ["Très faible", "Faible", "Moyen", "Fort", "Très fort"];
  const colors = [
    "bg-destructive",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-success",
    "bg-success",
  ];

  return (
    <div className="mt-1 space-y-1">
      <div className="flex h-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-full w-1/4 rounded-full transition-colors ${
              i < strength ? colors[strength - 1] : "bg-border"
            }`}
          />
        ))}
      </div>
      {password && (
        <p className="text-xs text-muted-foreground">
          Force : <span className="font-medium">{labels[strength]}</span>
        </p>
      )}
    </div>
  );
};

// ====================================================
// 3. COMPOSANT PRINCIPAL
// ====================================================

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/store";

  // Redirection si déjà connecté
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Formulaires react-hook-form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = loginForm;

  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors, isSubmitting: isRegisterSubmitting },
    watch,
  } = registerForm;

  const watchPassword = watch("password", "");

  // Gestionnaire de connexion
  const onLogin = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        // Traduction des erreurs Supabase courantes
        if (error.message.includes("Invalid login credentials")) {
          setServerError("Email ou mot de passe incorrect.");
        } else if (error.message.includes("Email not confirmed")) {
          setServerError("Veuillez confirmer votre email avant de vous connecter.");
          // Optionnel : proposer de renvoyer l'email
        } else {
          setServerError(error.message);
        }
      } else {
        toast.success("Connexion réussie !");
        // La redirection est gérée par l'effet useEffect
      }
    } catch (err: any) {
      setServerError("Une erreur inattendue est survenue.");
    }
  };

  // Gestionnaire d'inscription
  const onRegister = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const { error } = await signUp(data.email, data.password);
      if (error) {
        if (error.message.includes("User already registered")) {
          setServerError("Cet email est déjà utilisé. Veuillez vous connecter.");
        } else {
          setServerError(error.message);
        }
      } else {
        toast.success("Compte créé ! Vérifiez votre email pour confirmer votre inscription.");
        setIsLogin(true); // bascule vers le formulaire de connexion
        registerForm.reset();
      }
    } catch (err: any) {
      setServerError("Une erreur inattendue est survenue.");
    }
  };

  // Récupération du mot de passe (lien)
  const handleForgotPassword = () => {
    navigate("/store/auth/reset-password");
  };

  // Démo en développement (optionnel)
  const handleDemoLogin = () => {
    if (import.meta.env.DEV) {
      loginForm.setValue("email", "demo@bulonet.com");
      loginForm.setValue("password", "Demo1234!");
      onLogin({ email: "demo@bulonet.com", password: "Demo1234!", rememberMe: false });
    }
  };

  return (
    <StoreLayout>
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {/* En-tête */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <User className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isLogin ? "Connexion" : "Créer un compte"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLogin
                ? "Connectez-vous pour suivre vos commandes"
                : "Rejoignez BULONET pour une expérience personnalisée"}
            </p>
          </div>

          {/* Formulaire avec animation de transition */}
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLoginSubmit(onLogin)}
                className="rounded-2xl bg-card p-6 shadow-soft space-y-4"
              >
                {/* Erreur serveur */}
                {serverError && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {serverError}
                  </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="votre@email.com"
                      className="pl-10"
                      {...loginRegister("email")}
                    />
                  </div>
                  {loginErrors.email && (
                    <p className="text-xs text-destructive">{loginErrors.email.message}</p>
                  )}
                </div>

                {/* Mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      {...loginRegister("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-xs text-destructive">{loginErrors.password.message}</p>
                  )}
                </div>

                {/* Options supplémentaires : remember me + forgot password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" {...loginRegister("rememberMe")} />
                    <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                      Se souvenir de moi
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                {/* Bouton de connexion */}
                <Button type="submit" className="w-full gap-2" disabled={isLoginSubmitting}>
                  {isLoginSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Se connecter
                </Button>

                {/* Lien vers inscription */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setServerError(null);
                    }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Pas encore de compte ? S'inscrire
                  </button>
                </div>

                {/* Bouton de démo (dev uniquement) */}
                {import.meta.env.DEV && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={handleDemoLogin}
                  >
                    Utiliser le compte démo (dev)
                  </Button>
                )}
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegisterSubmit(onRegister)}
                className="rounded-2xl bg-card p-6 shadow-soft space-y-4"
              >
                {/* Erreur serveur */}
                {serverError && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {serverError}
                  </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="votre@email.com"
                      className="pl-10"
                      {...registerRegister("email")}
                    />
                  </div>
                  {registerErrors.email && (
                    <p className="text-xs text-destructive">{registerErrors.email.message}</p>
                  )}
                </div>

                {/* Mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="register-password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      {...registerRegister("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrengthMeter password={watchPassword} />
                  {registerErrors.password && (
                    <p className="text-xs text-destructive">{registerErrors.password.message}</p>
                  )}
                </div>

                {/* Confirmation mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      {...registerRegister("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {registerErrors.confirmPassword && (
                    <p className="text-xs text-destructive">{registerErrors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Bouton d'inscription */}
                <Button type="submit" className="w-full gap-2" disabled={isRegisterSubmitting}>
                  {isRegisterSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Créer mon compte
                </Button>

                {/* Lien vers connexion */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setServerError(null);
                    }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Déjà un compte ? Se connecter
                  </button>
                </div>

                {/* Mention de sécurité */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-2">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Vos données sont protégées
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Pied de page */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Suivez vos commandes · Accès à votre historique</span>
          </div>
        </motion.div>
      </div>
    </StoreLayout>
  );
};

export default AuthPage;

// ====================================================
// 💡 CONSEILS & ORIENTATIONS
// ====================================================
// 1. Ce fichier doit être placé dans `src/pages/store/AuthPage.tsx`.
// 2. Il utilise react-hook-form avec zodResolver – assurez-vous que ces
//    dépendances sont installées : `npm install react-hook-form @hookform/resolvers zod`
// 3. Les composants UI (Checkbox) viennent de shadcn/ui ; installez-les
//    avec `npx shadcn-ui@latest add checkbox`.
// 4. Le hook `useAuth` doit fournir les méthodes `signIn`, `signUp`, et l'état `user`.
//    Les erreurs retournées doivent être des objets contenant un champ `message`.
// 5. La page de réinitialisation de mot de passe (`/store/auth/reset-password`)
//    n'est pas incluse ici ; créez-la séparément.
// 6. Les règles de validation du mot de passe (majuscule, c
