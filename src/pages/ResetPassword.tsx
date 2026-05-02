import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bike } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    // Supabase coloca a sessão de recovery automaticamente via hash
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("As senhas não coincidem"); return; }
    if (password.length < 6) { toast.error("Senha mínima de 6 caracteres"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Senha atualizada!");
    await supabase.auth.signOut();
    nav("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-dark">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-3 shadow-glow">
            <Bike className="w-9 h-9 text-primary-foreground" />
          </div>
          <h1 className="text-2xl text-display">Redefinir senha</h1>
          <p className="text-sm text-muted-foreground">Defina uma nova senha</p>
        </div>

        {!ready ? (
          <p className="text-center text-muted-foreground text-sm">
            Abra esta página pelo link enviado no seu e-mail.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div>
              <Label htmlFor="confirm">Confirmar senha</Label>
              <Input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" disabled={busy} className="w-full gradient-primary text-primary-foreground">
              {busy ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
