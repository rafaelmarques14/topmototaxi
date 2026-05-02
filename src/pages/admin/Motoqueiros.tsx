import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  nome: z.string().trim().min(1, "Nome obrigatório").max(120),
  cpf: z.string().trim().min(11, "CPF inválido").max(14),
  numero: z.string().trim().min(1, "Número obrigatório").max(10),
  data_nascimento: z.string().optional().or(z.literal("")),
});

interface M { id: string; nome: string; cpf: string; numero: string; data_nascimento: string | null; }

const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2") 
    .replace(/(\d{3})(\d)/, "$1.$2") 
    .replace(/(\d{3})(\d{1,2})/, "$1-$2") 
    .replace(/(-\d{2})\d+?$/, "$1"); 
};

export default function Motoqueiros() {
  const { user } = useAuth();
  const [list, setList] = useState<M[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<M | null>(null);
  const [form, setForm] = useState({ nome: "", cpf: "", numero: "", data_nascimento: "" });

  const load = async () => {
    const { data } = await supabase.from("motoqueiros").select("*").order("numero");
    setList((data as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { 
    setEditing(null); 
    setForm({ nome: "", cpf: "", numero: "", data_nascimento: "" }); 
    setOpen(true); 
  };
  
  const openEdit = (m: M) => { 
    setEditing(m); 
    setForm({ 
      nome: m.nome, 
      cpf: formatCPF(m.cpf),
      numero: m.numero, 
      data_nascimento: m.data_nascimento ?? "" 
    }); 
    setOpen(true); 
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    if (!user) { toast.error("Sessão inválida"); return; }
    const base = {
      nome: parsed.data.nome,
      cpf: parsed.data.cpf,
      numero: parsed.data.numero,
      data_nascimento: parsed.data.data_nascimento || null,
    };
    const { error } = editing
      ? await supabase.from("motoqueiros").update(base).eq("id", editing.id)
      : await supabase.from("motoqueiros").insert({ ...base, owner_id: user.id });
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Atualizado" : "Cadastrado");
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir motoqueiro?")) return;
    const { error } = await supabase.from("motoqueiros").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Excluído"); load(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Motoqueiros</h2>
          <p className="text-sm text-muted-foreground">{list.length} cadastrado(s)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Novo motoqueiro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} motoqueiro</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required /></div>
              <div><Label>Número *</Label><Input value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} required maxLength={10} /></div>
              <div>
                <Label>CPF *</Label>
                <Input 
                  value={form.cpf} 
                  onChange={e => setForm({ ...form, cpf: formatCPF(e.target.value) })} // Aplica a máscara no input
                  required 
                  maxLength={14} 
                />
              </div>
              <div><Label>Data de nascimento</Label><Input type="date" value={form.data_nascimento} onChange={e => setForm({ ...form, data_nascimento: e.target.value })} /></div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground">{editing ? "Salvar" : "Cadastrar"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {list.map(m => (
          <Card key={m.id} className="p-4 flex items-center gap-4">
            <Badge className="text-lg px-3 py-1 gradient-primary text-primary-foreground border-0">{m.numero}</Badge>
            <div className="flex-1">
              <p className="font-semibold">{m.nome}</p>
              <p className="text-xs text-muted-foreground">
                CPF: {formatCPF(m.cpf)}{m.data_nascimento && ` · Nasc.: ${new Date(m.data_nascimento).toLocaleDateString("pt-BR")}`}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => remove(m.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
          </Card>
        ))}
        {list.length === 0 && <p className="text-center text-muted-foreground py-12">Nenhum motoqueiro ainda. Cadastre o primeiro!</p>}
      </div>
    </div>
  );
}