import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { StoreProvider } from "@/hooks/useStore";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import LoginPage from "./pages/admin/LoginPage.tsx";
import ImportPage from "./pages/admin/ImportPage.tsx";
import DashboardPage from "./pages/admin/DashboardPage.tsx";
import ProductsPage from "./pages/admin/ProductsPage.tsx";
import MarketsPage from "./pages/admin/MarketsPage.tsx";
import CurrenciesPage from "./pages/admin/CurrenciesPage.tsx";
import OrdersPage from "./pages/admin/OrdersPage.tsx";
import StoreCatalog from "./pages/store/StoreCatalog.tsx";
import CartPage from "./pages/store/CartPage.tsx";
import CheckoutPage from "./pages/store/CheckoutPage.tsx";
import ProductDetailPage from "./pages/store/ProductDetailPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <StoreProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* Store */}
              <Route path="/store" element={<StoreCatalog />} />
              <Route path="/store/product/:id" element={<ProductDetailPage />} />
              <Route path="/store/cart" element={<CartPage />} />
              <Route path="/store/checkout" element={<CheckoutPage />} />
              {/* Admin */}
              <Route path="/admin/login" element={<LoginPage />} />
              <Route path="/admin" element={<DashboardPage />} />
              <Route path="/admin/products" element={<ProductsPage />} />
              <Route path="/admin/import" element={<ImportPage />} />
              <Route path="/admin/markets" element={<MarketsPage />} />
              <Route path="/admin/currencies" element={<CurrenciesPage />} />
              <Route path="/admin/orders" element={<OrdersPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </StoreProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
