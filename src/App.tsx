import { useState, useCallback, useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { setupNativeHandlers } from "@/lib/native";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { SiteContentProvider } from "@/hooks/useSiteContent";
import SplashScreen from "@/components/SplashScreen";
import BottomNav from "@/components/BottomNav";
import Index from "./pages/Index";
import Donations from "./pages/Donations";
import Map from "./pages/Map";
import Profile from "./pages/Profile";
import ActionDetail from "./pages/ActionDetail";
import Participate from "./pages/Participate";
import Classes from "./pages/Classes";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import ParentDashboard from "./pages/ParentDashboard";
import Volunteer from "./pages/Volunteer";
import Events from "./pages/Events";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  if (loading || adminLoading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Auth />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          }
        />
        <Route
          path="/acao/:slug"
          element={
            <ProtectedRoute>
              <ActionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/acao/:slug/participar"
          element={
            <ProtectedRoute>
              <Participate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aulas"
          element={
            <ProtectedRoute>
              <Classes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doacoes"
          element={
            <ProtectedRoute>
              <Donations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mapa"
          element={
            <ProtectedRoute>
              <Map />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/responsavel"
          element={
            <ProtectedRoute>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracoes"
          element={
            <AdminRoute>
              <Settings />
            </AdminRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
        <Route
          path="/ajuda"
          element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          }
        />
        <Route
          path="/voluntarios"
          element={
            <ProtectedRoute>
              <Volunteer />
            </ProtectedRoute>
          }
        />
        =======
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Auth />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          }
        />
        <Route
          path="/acao/:slug"
          element={
            <ProtectedRoute>
              <ActionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/acao/:slug/participar"
          element={
            <ProtectedRoute>
              <Participate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aulas"
          element={
            <ProtectedRoute>
              <Classes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/eventos"
          element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doacoes"
          element={
            <ProtectedRoute>
              <Donations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mapa"
          element={
            <ProtectedRoute>
              <Map />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/responsavel"
          element={
            <ProtectedRoute>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracoes"
          element={
            <AdminRoute>
              <Settings />
            </AdminRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
        <Route
          path="/ajuda"
          element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          }
        />
        <Route
          path="/voluntarios"
          element={
            <ProtectedRoute>
              <Volunteer />
            </ProtectedRoute>
          }
        />
        d64a7cebd793ee34fc1f7dd5e8cb4f6c6fd6c0ee
        <Route path="*" element={<NotFound />} />
      </Routes>
      {user && <BottomNav />}
    </>
  );
};

// Botão voltar do Android, deep links de login e links externos no app nativo.
const NativeHandlers = () => {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  useEffect(() => setupNativeHandlers(() => navigateRef.current(-1)), []);
  return null;
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashFinish = useCallback(() => setShowSplash(false), []);

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NativeHandlers />
          <AuthProvider>
            <SiteContentProvider>
              <AppRoutes />
            </SiteContentProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
