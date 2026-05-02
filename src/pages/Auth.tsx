import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Bike } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => { if (!loading && user) nav("/admin"); }, [user, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/admin` }
        });
        if (error) throw error;
        toast.success("Conta criada! Você já pode entrar.");
        setMode("login");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Enviamos um link de redefinição para o seu e-mail.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo!");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao autenticar");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-dark">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-3 shadow-glow">
            <Bike className="w-9 h-9 text-primary-foreground" />
          </div>
          <h1 className="text-2xl text-display">Top Mototáxi</h1>
          <p className="text-sm text-muted-foreground">Painel administrativo</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          {mode !== "forgot" && (
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
          )}
          <Button type="submit" disabled={busy} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
            {busy ? "Aguarde..." : mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
          </Button>
        </form>

        <div className="text-center mt-4 text-sm space-y-2">
          {mode === "login" && (
            <div>
              <button onClick={() => setMode("forgot")} className="text-primary hover:underline">
                Esqueci minha senha
              </button>
            </div>
          )}
          <div>
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-primary hover:underline">
            {mode === "signup" || mode === "forgot" ? "Já tenho conta" : "Criar conta de administrador"}
          </button>
          </div>
        </div>
        <div className="text-center mt-3 text-sm">
          <Link to="/" className="text-muted-foreground hover:underline">← Tela de chamada</Link>
        </div>
      </Card>
    </div>
  );
}
