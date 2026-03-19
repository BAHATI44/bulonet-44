// ======================================================
// Fichier     : src/hooks/useAuth.tsx
// Projet      : Bulonet 🚀
// Description : Contexte d'authentification – gère la session,
//               l'utilisateur, le rôle admin, l'inscription,
//               la connexion, la déconnexion, et le rafraîchissement
//               du token. Intègre des fonctionnalités avancées :
//               gestion d'erreur typée, vérification du rôle
//               avec fallback, mise à jour du profil, et protection
//               contre les appels concurrents.
// ======================================================

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { toast } from 'sonner';

// ====================================================
// 1. TYPES
// ====================================================

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;                // Chargement initial
  isAuthenticating: boolean;       // En cours de connexion/inscription
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUserProfile: (data: { full_name?: string; avatar_url?: string }) => Promise<{ error: AuthError | null }>;
}

// ====================================================
// 2. CRÉATION DU CONTEXTE
// ====================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ====================================================
// 3. PROVIDER PRINCIPAL
// ====================================================

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Référence pour éviter les appels multiples à checkAdmin
  const checkAdminPromise = useRef<Promise<void> | null>(null);

  // ====================================================
  // 4. VÉRIFICATION DU RÔLE ADMIN (avec cache)
  // ====================================================

  const checkAdmin = useCallback(async (userId: string): Promise<boolean> => {
    // Si une vérification est déjà en cours, on attend son résultat
    if (checkAdminPromise.current) {
      await checkAdminPromise.current;
      return isAdmin; // retourne la valeur actuelle (mise à jour après)
    }

    const promise = (async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
          console.error('Erreur lors de la vérification du rôle admin :', error);
          return false;
        }
        return !!data;
      } catch (err) {
        console.error('Erreur inattendue :', err);
        return false;
      }
    })();

    checkAdminPromise.current = promise;
    const isAdminResult = await promise;
    checkAdminPromise.current = null;
    return isAdminResult;
  }, []);

  // ====================================================
  // 5. MISE À JOUR DE L'ÉTAT APRÈS CHANGEMENT DE SESSION
  // ====================================================

  const updateAuthState = useCallback(async (newSession: Session | null) => {
    setSession(newSession);
    setUser(newSession?.user ?? null);

    if (newSession?.user) {
      const admin = await checkAdmin(newSession.user.id);
      setIsAdmin(admin);
    } else {
      setIsAdmin(false);
    }
  }, [checkAdmin]);

  // ====================================================
  // 6. ÉCOUTE DES CHANGEMENTS D'AUTH (initialisation)
  // ====================================================

  useEffect(() => {
    let mounted = true;

    // Récupération de la session initiale
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) {
          await updateAuthState(initialSession);
          setLoading(false);
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'authentification :', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Abonnement aux changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (mounted) {
          await updateAuthState(newSession);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [updateAuthState]);

  // ====================================================
  // 7. RAFRAÎCHISSEMENT MANUEL DE LA SESSION
  // ====================================================

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      await updateAuthState(refreshedSession);
      toast.success('Session rafraîchie');
    } catch (error) {
      toast.error('Impossible de rafraîchir la session');
      console.error(error);
    }
  }, [updateAuthState]);

  // ====================================================
  // 8. CONNEXION
  // ====================================================

  const signIn = useCallback(async (email: string, password: string) => {
    setIsAuthenticating(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Traduction des erreurs courantes
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou mot de passe incorrect');
        } else {
          toast.error(error.message);
        }
        return { error };
      }
      toast.success('Connexion réussie');
      return { error: null };
    } catch (err) {
      const error = err as AuthError;
      toast.error('Erreur de connexion');
      return { error };
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  // ====================================================
  // 9. INSCRIPTION
  // ====================================================

  const signUp = useCallback(async (email: string, password: string) => {
    setIsAuthenticating(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/store/auth`,
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('Cet email est déjà utilisé');
        } else {
          toast.error(error.message);
        }
        return { error };
      }

      // Vérifier si une confirmation par email est nécessaire
      const needsEmailConfirmation = data.user?.identities?.length === 0 || !data.session;
      if (needsEmailConfirmation) {
        toast.success('Compte créé ! Vérifiez vos emails pour confirmer votre inscription.');
      } else {
        toast.success('Inscription réussie !');
      }

      return { error: null, needsEmailConfirmation };
    } catch (err) {
      const error = err as AuthError;
      toast.error('Erreur lors de l\'inscription');
      return { error };
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  // ====================================================
  // 10. DÉCONNEXION
  // ====================================================

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Déconnexion réussie');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
      console.error(error);
    }
  }, []);

  // ====================================================
  // 11. MISE À JOUR DU PROFIL UTILISATEUR
  // ====================================================

  const updateUserProfile = useCallback(async (data: { full_name?: string; avatar_url?: string }) => {
    try {
      const { error } = await supabase.auth.updateUser({ data });
      if (error) throw error;
      toast.success('Profil mis à jour');
      return { error: null };
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      return { error: error as AuthError };
    }
  }, []);

  // ====================================================
  // 12. VALEUR DU CONTEXTE
  // ====================================================

  const value: AuthContextType = {
    session,
    user,
    isAdmin,
    loading,
    isAuthenticating,
    signIn,
    signUp,
    signOut,
    refreshSession,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ====================================================
// 13. HOOK D'UTILISATION
// ====================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ====================================================
// 💡 CONSEILS & ORIENTATIONS
// ====================================================
// - Ce fichier doit être placé dans `src/hooks/useAuth.tsx`.
// - Il doit être importé dans `App.tsx` pour envelopper les routes.
// - Le hook utilise `toast` pour les notifications ; assurez-vous que
//   `Toaster` est présent dans l'arbre des composants.
// - La vérification du rôle admin utilise une table `user_roles`.
//   Adaptez la requête si votre structure est différente.
// - Le champ `isAuthenticating` permet de désactiver les boutons pendant
//   les opérations de connexion/inscription.
// - La fonction `refreshSession` peut être appelée périodiquement pour
//   maintenir la session active (ex: toutes les heures).
// - Pour une sécurité accrue, utilisez le rate limiter côté serveur.
// - Pensez à configurer les politiques RLS pour la table `user_roles`.
// ====================================================
