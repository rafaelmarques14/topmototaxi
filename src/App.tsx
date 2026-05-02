import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";
import Display from "./pages/Display";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Fila from "./pages/admin/Fila";
import Motoqueiros from "./pages/admin/Motoqueiros";
import Relatorios from "./pages/admin/Relatorios";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Admin = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><AdminLayout>{children}</AdminLayout></ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Display />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin" element={<Admin><Fila /></Admin>} />
            <Route path="/admin/motoqueiros" element={<Admin><Motoqueiros /></Admin>} />
            <Route path="/admin/relatorios" element={<Admin><Relatorios /></Admin>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
