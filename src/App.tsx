import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { StoreProvider } from '@/hooks/useStore';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { ModalProvider } from '@/contexts/ModalContext';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '@/components/ErrorFallback';
import LoadingSpinner from '@/components/LoadingSpinner';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 10, retry: 1, refetchOnWindowFocus: false } },
});

const Index = lazy(() => import('./pages/Index'));
const StoreCatalog = lazy(() => import('./pages/store/StoreCatalog'));
const ProductDetailPage = lazy(() => import('./pages/store/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/store/CartPage'));
const CheckoutPage = lazy(() => import('./pages/store/CheckoutPage'));
const AuthPage = lazy(() => import('./pages/store/AuthPage'));
const AccountPage = lazy(() => import('./pages/store/AccountPage'));
const LoginPage = lazy(() => import('./pages/admin/LoginPage'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const ProductsPage = lazy(() => import('./pages/admin/ProductsPage'));
const ImportPage = lazy(() => import('./pages/admin/ImportPage'));
const MarketsPage = lazy(() => import('./pages/admin/MarketsPage'));
const CurrenciesPage = lazy(() => import('./pages/admin/CurrenciesPage'));
const OrdersPage = lazy(() => import('./pages/admin/OrdersPage'));
const AIAgentsPage = lazy(() => import('./pages/admin/AIAgentsPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

const ProtectedAdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
};

const PageTracker = () => {
  const location = useLocation();
  useEffect(() => { /* analytics tracking placeholder */ }, [location]);
  return null;
};

const App = () => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <ModalProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner richColors position="top-right" />
              <BrowserRouter>
                <PageTracker />
                <AuthProvider>
                  <StoreProvider>
                    <Suspense fallback={<LoadingSpinner fullScreen />}>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/store" element={<StoreCatalog />} />
                        <Route path="/store/product/:id" element={<ProductDetailPage />} />
                        <Route path="/store/cart" element={<CartPage />} />
                        <Route path="/store/checkout" element={<CheckoutPage />} />
                        <Route path="/store/auth" element={<AuthPage />} />
                        <Route path="/store/account" element={<AccountPage />} />
                        <Route path="/admin/login" element={<LoginPage />} />
                        <Route path="/admin" element={<ProtectedAdminRoute><DashboardPage /></ProtectedAdminRoute>} />
                        <Route path="/admin/products" element={<ProtectedAdminRoute><ProductsPage /></ProtectedAdminRoute>} />
                        <Route path="/admin/import" element={<ProtectedAdminRoute><ImportPage /></ProtectedAdminRoute>} />
                        <Route path="/admin/markets" element={<ProtectedAdminRoute><MarketsPage /></ProtectedAdminRoute>} />
                        <Route path="/admin/currencies" element={<ProtectedAdminRoute><CurrenciesPage /></ProtectedAdminRoute>} />
                        <Route path="/admin/orders" element={<ProtectedAdminRoute><OrdersPage /></ProtectedAdminRoute>} />
                        <Route path="/admin/ai-agents" element={<ProtectedAdminRoute><AIAgentsPage /></ProtectedAdminRoute>} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </StoreProvider>
                </AuthProvider>
              </BrowserRouter>
            </TooltipProvider>
          </ModalProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
