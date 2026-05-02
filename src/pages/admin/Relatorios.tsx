import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bike } from "lucide-react";

interface Viagem { id: string; iniciada_em: string; motoqueiro_id: string; motoqueiro: { nome: string; numero: string } | null; }

type Period = "dia" | "mes" | "ano" | "tudo";

export default function Relatorios() {
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [period, setPeriod] = useState<Period>("dia");
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [year, setYear] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    supabase.from("viagens").select("id, iniciada_em, motoqueiro_id, motoqueiro:motoqueiros(nome, numero)").order("iniciada_em", { ascending: false })
      .then(({ data }) => setViagens((data as any) ?? []));
  }, []);

  const filtered = useMemo(() => viagens.filter(v => {
    const d = v.iniciada_em.slice(0, 10);
    if (period === "tudo") return true;
    if (period === "dia") return d === date;
    if (period === "mes") return d.slice(0, 7) === month;
    if (period === "ano") return d.slice(0, 4) === year;
    return true;
  }), [viagens, period, date, month, year]);

  const counts = useMemo(() => {
    const map = new Map<string, { nome: string; numero: string; total: number }>();
    filtered.forEach(v => {
      if (!v.motoqueiro) return;
      const cur = map.get(v.motoqueiro_id) ?? { nome: v.motoqueiro.nome, numero: v.motoqueiro.numero, total: 0 };
      cur.total++;
      map.set(v.motoqueiro_id, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Relatório de viagens</h2>
        <p className="text-sm text-muted-foreground">Total no período: <strong className="text-foreground">{filtered.length}</strong></p>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="space-y-2 min-w-0">
            <Label>Filtrar por</Label>
            <Select value={period} onValueChange={v => setPeriod(v as Period)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dia">Dia</SelectItem>
                <SelectItem value="mes">Mês</SelectItem>
                <SelectItem value="ano">Ano</SelectItem>
                <SelectItem value="tudo">Tudo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {period !== "tudo" && (
            <div className="space-y-2 min-w-0">
              {period === "dia" && (
                <>
                  <Label>Data</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full" />
                </>
              )}
              {period === "mes" && (
                <>
                  <Label>Mês</Label>
                  <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-full" />
                </>
              )}
              {period === "ano" && (
                <>
                  <Label>Ano</Label>
                  <Input type="number" value={year} onChange={e => setYear(e.target.value)} className="w-full" />
                </>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-3">
        {counts.map((c, i) => (
          <Card key={c.numero} className="p-4 flex items-center gap-4">
            <div className="text-xl font-bold w-8 text-muted-foreground">{i + 1}º</div>
            <Badge className="text-lg px-3 gradient-primary text-primary-foreground border-0">{c.numero}</Badge>
            <div className="flex-1 font-semibold">{c.nome}</div>
            <div className="flex items-center gap-2 shrink-0">
              <Bike className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{c.total}</span>
              <span className="text-sm text-muted-foreground hidden sm:inline">viagens</span>
            </div>
          </Card>
        ))}
        {counts.length === 0 && <Card className="p-12 text-center text-muted-foreground">Nenhuma viagem registrada no período.</Card>}
      </div>
    </div>
  );
}