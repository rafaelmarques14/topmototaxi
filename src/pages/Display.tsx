import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bike, Settings } from "lucide-react";

interface Item { id: string; posicao: number; motoqueiro: { nome: string; numero: string } | null; }

export default function Display() {
  const [items, setItems] = useState<Item[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("fila")
      .select("id, posicao, motoqueiro:motoqueiros(nome, numero)")
      .order("posicao", { ascending: true });
    setItems((data as any) ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("fila-display")
      .on("postgres_changes", { event: "*", schema: "public", table: "fila" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "motoqueiros" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const next = items[0];
  const upcoming = items.slice(1, 6);

  return (
    <div className="min-h-screen gradient-dark text-secondary-foreground flex flex-col">
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Bike className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl text-display">Top Mototáxi</h1>
            <p className="text-xs text-muted-foreground">Tela de atendimento</p>
          </div>
        </div>
        <Link to="/auth" className="text-muted-foreground hover:text-foreground transition">
          <Settings className="w-5 h-5" />
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <p className="uppercase tracking-[0.3em] text-sm text-accent mb-6">Próximo</p>

        {next ? (
          <div className="text-center animate-in fade-in zoom-in duration-500">
            <div className="text-display leading-none mb-8 text-primary" style={{ fontSize: "clamp(8rem, 30vw, 22rem)" }}>
              {next.motoqueiro?.numero}
            </div>
            <div className="text-display text-primary" style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)" }}>
              {next.motoqueiro?.nome}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-display text-muted-foreground" style={{ fontSize: "clamp(3rem, 10vw, 6rem)" }}>
              Fila vazia
            </div>
            <p className="text-muted-foreground mt-4">Aguardando motoqueiros...</p>
          </div>
        )}
      </main>

      {upcoming.length > 0 && (
        <footer className="border-t border-border/30 p-6 bg-background/5 backdrop-blur">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">A seguir</p>
          <div className="flex gap-4 flex-wrap">
            {upcoming.map((it, i) => (
              <div key={it.id} className="flex items-center gap-3 bg-background/10 rounded-xl px-4 py-3 backdrop-blur border border-border/20">
                <span className="text-xs text-muted-foreground">#{i + 2}</span>
                <span className="text-2xl text-display text-accent">{it.motoqueiro?.numero}</span>
                <span className="text-foreground">{it.motoqueiro?.nome}</span>
              </div>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}
