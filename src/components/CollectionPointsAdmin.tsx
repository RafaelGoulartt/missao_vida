import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, MapPin } from "lucide-react";

const emptyForm = { name: "", address: "", maps_url: "", sort_order: "0" };

const CollectionPointsAdmin = () => {
  const { toast } = useToast();
  const [points, setPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("collection_points" as any)
      .select("*")
      .order("sort_order", { ascending: true });
    setPoints((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sort_order: String(points.length + 1) });
    setShowForm(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      name: p.name || "",
      address: p.address || "",
      maps_url: p.maps_url || "",
      sort_order: String(p.sort_order ?? 0),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      toast({ title: "Informe nome e endereço do local", variant: "destructive" });
      return;
    }
    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      maps_url: form.maps_url.trim() || null,
      sort_order: parseInt(form.sort_order) || 0,
    };
    const { error } = editingId
      ? await supabase.from("collection_points" as any).update(payload as any).eq("id", editingId)
      : await supabase.from("collection_points" as any).insert(payload as any);

    if (error) {
      toast({ title: "Erro ao salvar local", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editingId ? "Local atualizado" : "Local adicionado" });
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este ponto de coleta?")) return;
    const { error } = await supabase.from("collection_points" as any).delete().eq("id", id);
    if (error) toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Local removido" });
      load();
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Pontos de coleta — Cupom fiscal</h3>
        <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditingId(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" onClick={openNew}><Plus className="h-4 w-4" /> Novo local</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Editar local" : "Adicionar local"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label>Nome do local</Label><Input value={form.name} maxLength={120} placeholder="Ex: Sede Missão Vida" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Endereço</Label><Input value={form.address} maxLength={250} placeholder="Rua, número, bairro, cidade" onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>Link do mapa (opcional)</Label><Input value={form.maps_url} placeholder="https://maps.app.goo.gl/..." onChange={(e) => setForm({ ...form, maps_url: e.target.value })} /></div>
              <div><Label>Ordem de exibição</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full">{editingId ? "Salvar alterações" : "Adicionar local"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {points.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Nenhum ponto de coleta cadastrado</div>
      ) : (
        points.map((p: any) => (
          <div key={p.id} className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{p.name}</h4>
                  <p className="text-xs text-muted-foreground">{p.address}</p>
                  {p.maps_url && <p className="text-[11px] text-muted-foreground mt-0.5 break-all">{p.maps_url}</p>}
                </div>
              </div>
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CollectionPointsAdmin;
