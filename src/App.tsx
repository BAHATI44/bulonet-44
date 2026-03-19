// ======================================================
// Fichier     : src/App.tsx
// Projet      : Bulonet 🚀
// Description : Point central de l'application – 
//               regroupe tous les providers globaux,
//               les routes publiques/privées,
//               et active les fonctionnalités avancées :
//               lazy loading, thème, i18n, protection,
//               tracking, error boundaries, etc.
// ======================================================

import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { StoreProvider } from '@/hooks/useStore';
import { ThemeProvider } from '@/contexts/ThemeContext';      // 🌓 Gestion du thème (clair/sombre)
import { I18nProvider } from '@/contexts/I18nContext';        // 🌍 Internationalisation
import { ModalProvider } from '@/contexts/ModalContext';      // 🪟 Gestion globale des modales
import { ErrorBoundary } from 'react-error-boundary';         // 🛡️ Capture les erreurs React
import { initAnalytics, trackPageView } from '@/lib/analytics'; // 📊 Analytics
import ErrorFallback from '@/components/ErrorFallback';        // ⚠️ UI de secours en cas d'erreur
import LoadingSpinner from '@/components/LoadingSpinner';      // ⏳ Loader pour Suspense

// ======================================================
// 1. Configuration de React Query
// ======================================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 minutes avant qu'une donnée ne soit considérée comme obsolète
      gcTime: 1000 * 60 * 10,           // 10 minutes avant de nettoyer le cache (anciennement cacheTime)
      retry: 1,                         // Nombre de tentatives en cas d'échec
      refetchOnWindowFocus: false,       // Évite les refetch inutiles quand on change d'onglet
    },
  },
});

// ======================================================
// 2. Lazy loading des pages (améliore les performances)
// ======================================================
// Pages publiques / store
const Index = lazy(() => import('./pages/Index'));
const StoreCatalog = lazy(() => import('./pages/store/StoreCatalog'));
const ProductDetailPage = lazy(() => import('./pages/store/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/store/CartPage'));
const CheckoutPage = lazy(() => import('./pages/store/CheckoutPage'));
const AuthPage = lazy(() => import('./pages/store/AuthPage'));
const AccountPage = lazy(() => import('./pages/store/AccountPage'));

// Pages admin
const LoginPage = lazy(() => import('./pages/admin/LoginPage'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const ProductsPage = lazy(() => import('./pages/admin/ProductsPage'));
const ImportPage = lazy(() => import('./pages/admin/ImportPage'));
const MarketsPage = lazy(() => import('./pages/admin/MarketsPage'));
const CurrenciesPage = lazy(() => import('./pages/admin/CurrenciesPage'));
const OrdersPage = lazy(() => import('./pages/admin/OrdersPage'));
const AIAgentsPage = lazy(() => import('./pages/admin/AIAgentsPage'));

// 404
const NotFound = lazy(() => import('./pages/NotFound'));

// ======================================================
// 3. Composant de protection des routes admin
// ======================================================
const ProtectedAdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />; // ou un skeleton
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

// ======================================================
// 4. Composant de tracking des pages (analytics)
// ======================================================
const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Envoie un événement de vue de page à chaque changement de route
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
};

// ======================================================
// 5. Composant principal App
// ======================================================
const App = () => {
  // Initialisation des analytics une seule fois
  useEffect(() => {
    if (import.meta.env.PROD) {
      initAnalytics({ domain: 'bulonet.com' });
    }
  }, []);

  return (
    // 🛡️ ErrorBoundaire global – capture les erreurs non rattrapées dans l'UI
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {/* 📦 React Query – gestion des données serveur */}
      <QueryClientProvider client={queryClient}>
        {/* 🎨 Thème (clair/sombre) */}
        <ThemeProvider>
          {/* 🌐 Internationalisation */}
          <I18nProvider>
            {/* 🪟 Modales globales (confirmations, formulaires, etc.) */}
            <ModalProvider>
              {/* 🖱️ Tooltips (shadcn/ui) */}
              <TooltipProvider>
                {/* 🔔 Notifications (toasts) */}
                <Toaster />
                <Sonner richColors position="top-right" />

                {/* 🌍 Router principal */}
                <BrowserRouter>
                  {/* 📊 Tracking des pages */}
                  <PageTracker />

                  {/* 🔐 Authentification */}
                  <AuthProvider>
                    {/* 🏪 Données de la boutique (panier, etc.) */}
                    <StoreProvider>
                      {/* ⏳ Suspense global – affiche un loader pendant le chargement des pages lazy */}
                      <Suspense fallback={<LoadingSpinner fullScreen />}>
                        <Routes>
                          {/* ------------- ROUTES PUBLIQUES ------------- */}
                          <Route path="/" element={<Index />} />

                          {/* Boutique */}
                          <Route path="/store" element={<StoreCatalog />} />
                          <Route path="/store/product/:id" element={<ProductDetailPage />} />
                          <Route path="/store/cart" element={<CartPage />} />
                          <Route path="/store/checkout" element={<CheckoutPage />} />
                          <Route path="/store/auth" element={<AuthPage />} />
                          <Route path="/store/account" element={<AccountPage />} />

                          {/* ------------- ROUTES ADMIN (protégées) ------------- */}
                          <Route path="/admin/login" element={<LoginPage />} />

                          {/* Toutes les routes sous /admin sont protégées */}
                          <Route
                            path="/admin"
                            element={
                              <ProtectedAdminRoute>
                                <DashboardPage />
                              </ProtectedAdminRoute>
                            }
                          />
                          <Route
                            path="/admin/products"
                            element={
                              <ProtectedAdminRoute>
                                <ProductsPage />
                              </ProtectedAdminRoute>
                            }
                          />
                          <Route
                            path="/admin/import"
                            element={
                              <ProtectedAdminRoute>
                                <ImportPage />
                              </ProtectedAdminRoute>
                            }
                          />
                          <Route
                            path="/admin/markets"
                            element={
                              <ProtectedAdminRoute>
                                <MarketsPage />
                              </ProtectedAdminRoute>
                            }
                          />
                          <Route
                            path="/admin/currencies"
                            element={
                              <ProtectedAdminRoute>
                                <CurrenciesPage />
                              </ProtectedAdminRoute>
                            }
                          />
                          <Route
                            path="/admin/orders"
                            element={
                              <ProtectedAdminRoute>
                                <OrdersPage />
                              </ProtectedAdminRoute>
                            }
                          />
                          <Route
                            path="/admin/ai-agents"
                            element={
                              <ProtectedAdminRoute>
                                <AIAgentsPage />
                              </ProtectedAdminRoute>
                            }
                          />

                          {/* ------------- 404 ------------- */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </StoreProvider>
                  </AuthProvider>
                </BrowserRouter>

                {/* 🛠️ Outils de développement React Query (uniquement en dev) */}
                {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
              </TooltipProvider>
            </ModalProvider>
          </I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

// ======================================================
// 💡 CONSEILS & ORIENTATIONS
// ======================================================
// 1. Ce fichier est le CŒUR de l'application – il doit rester lisible et modulaire.
// 2. Les providers sont empilés dans un ordre logique (ceux qui dépendent d'autres doivent être plus bas).
// 3. Le lazy loading + Suspense améliorent considérablement les performances initiales.
// 4. La protection des routes admin utilise le hook `useAuth` – assure-toi qu'il soit fonctionnel.
// 5. Les contexts (Theme, I18n, Modal) sont à créer séparément (ex: dans `src/contexts/`) si ce n'est pas déjà fait.
// 6. Pour une application encore plus robuste, tu pourrais ajouter :
//      - Un provider de performance monitoring (ex: Sentry)
//      - Un provider de feature flags
//      - Une gestion d'état globale (Zustand / Redux) si nécessaire
// 7. N'oublie pas d'adapter les imports si tes fichiers sont à des emplacements différents.
// ======================================================
