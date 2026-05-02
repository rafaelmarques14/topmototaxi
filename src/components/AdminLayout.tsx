import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bike, Users, ListOrdered, BarChart3, LogOut, Monitor } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin", label: "Fila", icon: ListOrdered, end: true },
  { to: "/admin/motoqueiros", label: "Motoqueiros", icon: Users },
  { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <Bike className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold leading-none">Top Mototáxi</h1>
              <p className="text-xs text-muted-foreground">Painel admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.open("/", "_blank")}>
              <Monitor className="w-4 h-4 mr-2" /> Tela
            </Button>
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); nav("/auth"); }}>
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
        <nav className="container px-4 flex gap-1 overflow-x-auto">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) => cn(
                "flex items-center gap-2 px-4 py-3 text-sm border-b-2 whitespace-nowrap transition",
                isActive ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
              )}>
              <l.icon className="w-4 h-4" /> {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 container px-4 py-6">{children}</main>
    </div>
  );
}
