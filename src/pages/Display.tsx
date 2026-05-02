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
    <div className="min-h-screen bg-black text-secondary-foreground flex flex-col">
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Bike className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl text-display text-white">Top Mototáxi</h1>
            <p className="text-xs text-muted-foreground">Atendimento</p>
          </div>
        </div>
        <Link to="/auth" className="text-muted-foreground hover:text-white transition">
          <Settings className="w-5 h-5" />
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="flex flex-col items-center justify-center w-full max-w-5xl mx-auto">
          <p 
            className="uppercase tracking-[0.3em] font-bold text-accent mb-6 text-center ml-[0.3em]" 
            style={{ fontSize: "clamp(5.5rem, 4vw, 3.5rem)" }}
          >
            Próximo
          </p>

          {next ? (
            <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
              <div 
                className="text-display leading-none mb-4 text-primary font-black" 
                style={{ fontSize: "clamp(10rem, 45vw, 35rem)" }}
              >
                {next.motoqueiro?.numero}
              </div>
              <div 
                className="text-display text-primary font-semibold" 
                style={{ fontSize: "clamp(3rem, 10vw, 8rem)" }}
              >
                {next.motoqueiro?.nome}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-display text-muted-foreground" style={{ fontSize: "clamp(3rem, 10vw, 6rem)" }}>
                Fila vazia
              </div>
              <p className="text-muted-foreground mt-4 text-2xl">Aguardando motoqueiros...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}