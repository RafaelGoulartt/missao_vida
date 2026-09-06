import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Users, Pencil } from "lucide-react";

const emptyForm = { title: "", description: "", address: "", event_date: "", time_slot: "", max_capacity: "50" };

const EventsAdmin = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [evRes, regRes, profRes] = await Promise.all([
      supabase.from("events" as any).select("*").order("event_date", { ascending: true }),
      supabase.from("event_registrations" as any).select("*"),
      supabase.from("profiles" as any).select("*"),
    ]);
    setEvents((evRes.data as any[]) || []);
    setRegistrations((regRes.data as any[]) || []);
    setProfiles((profRes.data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const getUserName = (userId: string) =>
    profiles.find((p: any) => p.user_id === userId)?.display_name || "Usuário";

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (ev: any) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title || "",
      description: ev.description || "",
      address: ev.address || "",
      event_date: ev.event_date || "",
      time_slot: ev.time_slot || "",
      max_capacity: ev.max_capacity ? String(ev.max_capacity) : "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.event_date) {
      toast({ title: "Informe o nome e a data do evento", variant: "destructive" });
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      address: form.address.trim() || null,
      event_date: form.event_date,
      time_slot: form.time_slot.trim() || null,
      max_capacity: parseInt(form.max_capacity) || null,
    };
    const { error } = editingId
      ? await supabase.from("events" as any).update(payload as any).eq("id", editingId)
      : await supabase.from("events" as any).insert(payload as any);
    if (error) {
      toast({ title: "Erro ao salvar evento", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editingId ? "Evento atualizado!" : "Evento criado com sucesso!" });
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("events" as any).delete().eq("id", id);
    if (error) toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Evento excluído" });
      load();
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Eventos Cadastrados</h3>
        <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditingId(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" onClick={openNew}><Plus className="h-4 w-4" /> Novo Evento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Editar Evento" : "Criar Novo Evento"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label>Nome do evento</Label><Input placeholder="Ex: Distribuição de alimentos" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} /></div>
              <div><Label>Descrição</Label><Input placeholder="Detalhes do evento" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={300} /></div>
              <div><Label>Endereço</Label><Input placeholder="Rua, número, bairro, cidade" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} maxLength={200} /></div>
              <div><Label>Data</Label><Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
              <div><Label>Horário</Label><Input placeholder="Ex: 09:00 - 12:00" value={form.time_slot} onChange={(e) => setForm({ ...form, time_slot: e.target.value })} /></div>
              <div><Label>Quantidade máxima de participantes</Label><Input type="number" min="1" value={form.max_capacity} onChange={(e) => setForm({ ...form, max_capacity: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full">{editingId ? "Salvar alterações" : "Criar Evento"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Nenhum evento cadastrado ainda</div>
      ) : (
        events.map((ev: any) => {
          const regs = registrations.filter((r: any) => r.event_id === ev.id);
          const capacity = ev.max_capacity || 50;
          return (
            <div key={ev.id} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{ev.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {new Date(`${ev.event_date}T00:00:00`).toLocaleDateString("pt-BR")}
                    {ev.time_slot ? ` • ${ev.time_slot}` : ""}
                  </p>
                  {ev.address && <p className="text-xs text-muted-foreground mt-0.5">📍 {ev.address}</p>}
                  {ev.description && <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>}
                </div>
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(ev)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(ev.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{regs.length}/{capacity} inscritos</span>
                </div>
                <div className="h-1.5 flex-1 mx-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((regs.length / capacity) * 100, 100)}%` }} />
                </div>
              </div>

              {regs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                  {regs.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between">
                      <span className="text-xs text-foreground">{getUserName(r.user_id)}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {new Date(r.registered_at).toLocaleDateString("pt-BR")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default EventsAdmin;
