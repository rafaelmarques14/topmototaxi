import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ArrowDown, ArrowUp, Plus, Play, Trash2, RotateCcw, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface FilaItem { id: string; posicao: number; motoqueiro_id: string; motoqueiro: { id: string; nome: string; numero: string } | null; }
interface Motoqueiro { id: string; nome: string; numero: string; }

export default function Fila() {
  const { user } = useAuth();
  const [fila, setFila] = useState<FilaItem[]>([]);
  const [motos, setMotos] = useState<Motoqueiro[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = async () => {
    const [{ data: f }, { data: m }] = await Promise.all([
      supabase.from("fila").select("id, posicao, motoqueiro_id, motoqueiro:motoqueiros(id, nome, numero)").order("posicao"),
      supabase.from("motoqueiros").select("id, nome, numero").eq("ativo", true).order("numero"),
    ]);
    setFila((f as any) ?? []);
    setMotos((m as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const disponiveis = motos.filter(m => !fila.some(f => f.motoqueiro_id === m.id));

  const addToQueue = async (id: string) => {
    if (!user) return;
    const next = (fila[fila.length - 1]?.posicao ?? 0) + 1;
    const { error } = await supabase.from("fila").insert({ motoqueiro_id: id, posicao: next, owner_id: user.id });
    if (error) toast.error(error.message); else { toast.success("Adicionado à fila"); setSelected(""); load(); }
  };

  const removeFromQueue = async (item: FilaItem) => {
    const { error } = await supabase.from("fila").delete().eq("id", item.id);
    if (error) toast.error(error.message); else { toast.success("Removido"); load(); }
  };

  const startTrip = async (item: FilaItem) => {
    if (!user) return;
    const { error: e1 } = await supabase.from("viagens").insert({ motoqueiro_id: item.motoqueiro_id, owner_id: user.id });
    if (e1) { toast.error(e1.message); return; }
    const { error: e2 } = await supabase.from("fila").delete().eq("id", item.id);
    if (e2) { toast.error(e2.message); return; }
    toast.success(`${item.motoqueiro?.nome} saiu para a viagem!`);
    load();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const a = fila[idx], b = fila[idx + dir];
    if (!a || !b) return;
    await supabase.from("fila").update({ posicao: -1 }).eq("id", a.id);
    await supabase.from("fila").update({ posicao: a.posicao }).eq("id", b.id);
    await supabase.from("fila").update({ posicao: b.posicao }).eq("id", a.id);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Fila de atendimento</h2>
        <p className="text-sm text-muted-foreground">Gerencie a ordem dos motoqueiros</p>
      </div>

      <Card className="p-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground">Adicionar motoqueiro ao final da fila</label>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                  disabled={disponiveis.length === 0}
                >
                  {selected
                    ? (() => {
                        const m = motos.find(x => x.id === selected);
                        return m ? `${m.numero} - ${m.nome}` : "Selecione";
                      })()
                    : (disponiveis.length ? "Buscar motoqueiro pelo nome..." : "Todos já estão na fila")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Digite o nome ou número..." />
                  <CommandList>
                    <CommandEmpty>Nenhum motoqueiro encontrado.</CommandEmpty>
                    <CommandGroup>
                      {disponiveis.map(m => (
                        <CommandItem
                          key={m.id}
                          value={`${m.numero} ${m.nome}`}
                          onSelect={() => { setSelected(m.id); setPickerOpen(false); }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", selected === m.id ? "opacity-100" : "opacity-0")} />
                          <span className="font-semibold mr-2">{m.numero}</span>
                          {m.nome}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <Button disabled={!selected} onClick={() => addToQueue(selected)} className="gradient-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> Adicionar
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        {fila.map((item, i) => (
          <Card key={item.id} className={`p-4 flex items-center gap-3 ${i === 0 ? "border-primary border-2 shadow-elegant" : ""}`}>
            <div className="text-2xl font-bold text-muted-foreground w-10">{i + 1}º</div>
            <Badge className="text-lg px-3 gradient-primary text-primary-foreground border-0">{item.motoqueiro?.numero}</Badge>
            <div className="flex-1 font-semibold">{item.motoqueiro?.nome}</div>
            <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="w-4 h-4" /></Button>
            <Button size="icon" variant="ghost" disabled={i === fila.length - 1} onClick={() => move(i, 1)}><ArrowDown className="w-4 h-4" /></Button>
            {i === 0 && (
              <Button size="sm" onClick={() => startTrip(item)} className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:opacity-90">
                <Play className="w-4 h-4 mr-2" /> Saiu para viagem
              </Button>
            )}
            <Button size="icon" variant="ghost" onClick={() => removeFromQueue(item)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
          </Card>
        ))}
        {fila.length === 0 && (
          <Card className="p-12 text-center">
            <RotateCcw className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum motoqueiro na fila</p>
          </Card>
        )}
      </div>
    </div>
  );
}
