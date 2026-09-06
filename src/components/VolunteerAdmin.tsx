import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, User, X, Calendar, Upload, Loader2, Pencil, Save } from "lucide-react";

interface Action {
  id: string;
  title: string;
  description: string | null;
  action_date: string;
  location: string | null;
  entry_fee: number;
  pix_key: string;
  image_url: string | null;
}

interface Registration {
  id: string;
  action_id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  payment_status: string;
  amount_paid: number;
  created_at: string;
}

const VolunteerAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [actions, setActions] = useState<Action[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    action_date: "",
    location: "",
    entry_fee: "",
    pix_key: "",
    image_url: "",
  });

  const load = async () => {
    setLoading(true);
    const [{ data: a }, { data: r }] = await Promise.all([
      supabase.from("volunteer_actions" as any).select("*").order("action_date", { ascending: true }),
      supabase.from("volunteer_registrations" as any).select("*").order("created_at", { ascending: false }),
    ]);
    setActions((a as any) || []);
    setRegs((r as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const emptyForm = { title: "", description: "", action_date: "", location: "", entry_fee: "", pix_key: "", image_url: "" };

  const openEdit = (a: Action) => {
    setEditingId(a.id);
    setForm({
      title: a.title || "",
      description: a.description || "",
      action_date: new Date(a.action_date).toISOString().slice(0, 16),
      location: a.location || "",
      entry_fee: String(a.entry_fee ?? ""),
      pix_key: a.pix_key || "",
      image_url: a.image_url || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!form.title || !form.action_date || !form.pix_key) {
      toast({ title: "Preencha título, data e chave PIX", variant: "destructive" });
      return;
    }
    const fee = parseFloat(form.entry_fee || "0");
    if (isNaN(fee) || fee < 0) {
      toast({ title: "Valor de ingresso inválido", variant: "destructive" });
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      action_date: new Date(form.action_date).toISOString(),
      location: form.location.trim() || null,
      entry_fee: fee,
      pix_key: form.pix_key.trim(),
      image_url: form.image_url || null,
    };
    const { error } = editingId
      ? await supabase.from("volunteer_actions" as any).update(payload as any).eq("id", editingId)
      : await supabase.from("volunteer_actions" as any).insert({ ...payload, created_by: user?.id } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editingId ? "Ação atualizada!" : "Ação criada!" });
    setForm(emptyForm);
    setEditingId(null);
    load();
  };

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `volunteer/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("news-images").upload(path, file, { upsert: false });
    if (error) {
      toast({ title: "Erro ao enviar imagem", description: error.message, variant: "destructive" });
    } else {
      const { data } = supabase.storage.from("news-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast({ title: "Imagem enviada!" });
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta ação? Todas as inscrições serão excluídas.")) return;
    const { error } = await supabase.from("volunteer_actions" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Ação removida" });
    load();
  };

  const handleTogglePayment = async (reg: Registration, action: Action) => {
    const newStatus = reg.payment_status === "confirmed" ? "pending" : "confirmed";
    const newAmount = newStatus === "confirmed" ? Number(action.entry_fee) : 0;
    const { error } = await supabase
      .from("volunteer_registrations" as any)
      .update({ payment_status: newStatus, amount_paid: newAmount } as any)
      .eq("id", reg.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: newStatus === "confirmed" ? "Pagamento confirmado" : "Pagamento marcado como pendente" });
    load();
  };

  const handleRemoveReg = async (id: string) => {
    const { error } = await supabase.from("volunteer_registrations" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Inscrição removida" });
    load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{editingId ? "Editar ação de voluntariado" : "Nova ação de voluntariado"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} />
          </div>
          <div>
            <Label>Data e horário</Label>
            <Input type="datetime-local" value={form.action_date} onChange={(e) => setForm({ ...form, action_date: e.target.value })} />
          </div>
          <div>
            <Label>Local</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} maxLength={200} />
          </div>
          <div>
            <Label>Valor do ingresso (R$)</Label>
            <Input type="number" step="0.01" min="0" value={form.entry_fee} onChange={(e) => setForm({ ...form, entry_fee: e.target.value })} />
          </div>
          <div>
            <Label>Chave PIX para recebimento</Label>
            <Input value={form.pix_key} onChange={(e) => setForm({ ...form, pix_key: e.target.value })} maxLength={120} placeholder="email@dominio.com / CPF / chave aleatória" />
          </div>
          <div>
            <Label>Foto de capa do evento</Label>
            <div className="flex items-center gap-2">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                />
                <div className="flex items-center justify-center gap-2 h-10 rounded-md border border-dashed border-input bg-background text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Enviando..." : form.image_url ? "Trocar imagem" : "Selecionar imagem"}
                </div>
              </label>
              {form.image_url && (
                <Button variant="ghost" size="icon" type="button" onClick={() => setForm({ ...form, image_url: "" })}>
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
            {form.image_url && <img src={form.image_url} alt="Preview" className="mt-2 max-h-40 w-full rounded-lg border border-border object-cover" />}
          </div>
          <Button onClick={handleSave} className="w-full">
            {editingId ? <><Save className="h-4 w-4 mr-2" /> Salvar alterações</> : <><Plus className="h-4 w-4 mr-2" /> Criar ação</>}
          </Button>
          {editingId && (
            <Button variant="outline" className="w-full" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
              Cancelar edição
            </Button>
          )}

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : actions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma ação cadastrada.</p>
          ) : (
            actions.map((a) => {
              const aRegs = regs.filter((r) => r.action_id === a.id);
              return (
                <div key={a.id} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold">{a.title}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(a.action_date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </div>
                      {a.location && <p className="text-xs text-muted-foreground">{a.location}</p>}
                      <p className="text-sm font-bold mt-1">
                        R$ {Number(a.entry_fee).toFixed(2).replace(".", ",")} • PIX: {a.pix_key}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-muted rounded-lg p-2">
                    <p className="text-xs font-medium mb-2">Inscritos ({aRegs.length})</p>
                    {aRegs.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhum inscrito ainda</p>
                    ) : (
                      <div className="space-y-1.5">
                        {aRegs.map((r) => (
                          <div key={r.id} className="flex items-center justify-between gap-2 text-xs bg-card rounded p-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <User className="h-3 w-3 text-primary flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium truncate">{r.full_name}</p>
                                {r.phone && <p className="text-muted-foreground">{r.phone}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                size="sm"
                                variant={r.payment_status === "confirmed" ? "default" : "outline"}
                                className="h-7 text-[10px] px-2"
                                onClick={() => handleTogglePayment(r, a)}
                              >
                                {r.payment_status === "confirmed" ? "Pago" : "Pendente"}
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRemoveReg(r.id)}>
                                <X className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VolunteerAdmin;
