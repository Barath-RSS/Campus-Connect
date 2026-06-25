import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AnimatePresence } from "framer-motion";
import { SplashScreen } from "./components/SplashScreen";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { lazy, Suspense, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Code-split role-specific pages so a student's bundle never ships
// official/staff UI code (mitigates client-side role-bypass info disclosure).
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const CommandCenter = lazy(() => import("./pages/CommandCenter"));
const StaffDashboard = lazy(() => import("./pages/StaffDashboard"));
const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient();

type AppRole = 'student' | 'official' | 'staff' | null;

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole?: AppRole }) {
  const { user, role, loading } = useAuth();
  const typedRole = role as AppRole;
  const [serverVerified, setServerVerified] = useState<boolean | null>(null);

  // Re-verify the requested role against the database on every protected
  // mount so a tampered client-side `role` state cannot grant UI access.
  useEffect(() => {
    let cancelled = false;
    setServerVerified(null);

    if (!user || !allowedRole) {
      setServerVerified(true);
      return;
    }

    (async () => {
      try {
        if (allowedRole === 'staff') {
          const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'staff' as any);
          if (cancelled) return;
          setServerVerified(!error && !!data && data.length > 0);
        } else {
          const { data, error } = await supabase.rpc('has_role', {
            _user_id: user.id,
            _role: allowedRole,
          });
          if (cancelled) return;
          setServerVerified(!error && data === true);
        }
      } catch {
        if (!cancelled) setServerVerified(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id, allowedRole]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Initial client-side check (cheap) — also redirects when role mismatch is already known.
  if (allowedRole && typedRole !== allowedRole) {
    if (typedRole === 'official') return <Navigate to="/command-center" replace />;
    if (typedRole === 'staff') return <Navigate to="/staff-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  // Authoritative server-side verification
  if (allowedRole && serverVerified === null) {
    return <LoadingScreen />;
  }
  if (allowedRole && serverVerified === false) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function RedirectByRole() {
  const { user, role, loading } = useAuth();
  const typedRole = role as AppRole;

  if (loading) {
    return <LoadingScreen />;
  }

  if (user && typedRole) {
    if (typedRole === 'official') return <Navigate to="/command-center" replace />;
    if (typedRole === 'staff') return <Navigate to="/staff-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/auth" replace />;
}

function AppRoutes() {
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<RedirectByRole />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/command-center"
            element={
              <ProtectedRoute allowedRole="official">
                <CommandCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff-dashboard"
            element={
              <ProtectedRoute allowedRole="staff">
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="official">
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
