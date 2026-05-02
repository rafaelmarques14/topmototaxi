import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center p-6 text-center">
    <div>
      <h1 className="text-xl font-bold mb-2">Acesso negado</h1>
      <p className="text-muted-foreground">Sua conta não possui permissão de administrador.</p>
    </div>
  </div>;
  return <>{children}</>;
}
