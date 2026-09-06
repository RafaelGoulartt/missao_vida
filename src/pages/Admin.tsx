import { useState, useEffect } from "react";
import { ArrowLeft, Users, DollarSign, BookOpen, Shield, Search, Plus, Trash2, UserCheck, Link2, CalendarDays, FileText, Sparkles, Newspaper, HandHeart, Pencil, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import ContentManager from "@/components/ContentManager";
import SponsorshipAdmin from "@/components/SponsorshipAdmin";
import NewsAdmin from "@/components/NewsAdmin";
import VolunteerAdmin from "@/components/VolunteerAdmin";
import EventsAdmin from "@/components/EventsAdmin";
import CollectionPointsAdmin from "@/components/CollectionPointsAdmin";
import { Switch } from "@/components/ui/switch";

type AdminTab = "alunos" | "doacoes" | "assinaturas" | "aulas" | "eventos" | "presencas" | "responsaveis" | "conteudo" | "noticias" | "apadrinhar" | "voluntarios" | "locais" | "seguranca";

const DAY_LABELS: Record<string, string> = {

  segunda: "Segunda", terca: "Terça", quarta: "Quarta", quinta: "Quinta",
  sexta: "Sexta", sabado: "Sábado", domingo: "Domingo",
  "Segunda-feira": "Segunda", "Terça-feira": "Terça", "Quarta-feira": "Quarta", "Quinta-feira": "Quinta",
  "Sexta-feira": "Sexta", "Sábado": "Sábado", "Domingo": "Domingo",
};

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("alunos");
  const [search, setSearch] = useState("");

  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [parentLinks, setParentLinks] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [showClassForm, setShowClassForm] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [classForm, setClassForm] = useState({ title: "", address: "", day_of_week: "", time_slot: "", max_capacity: "30" });
  const [linkForm, setLinkForm] = useState({ parent_user_id: "", child_user_id: "", relationship: "responsável" });
  const [subscriptionAmounts, setSubscriptionAmounts] = useState<Record<string, string>>({});
  const [attendanceDates, setAttendanceDates] = useState<Record<string, string>>({});
  const [pixStats, setPixStats] = useState<any>(null);
  const [pixStatsForm, setPixStatsForm] = useState({ month_goal: "", current_amount: "", donor_count: "", month_label: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [enrollRes, donRes, classRes, usersRes, attendanceRes, linksRes, subsRes, rolesRes, pixRes, permsRes] = await Promise.all([
      supabase.from("class_enrollments" as any).select("*, classes(*)"),
      supabase.from("donations" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("classes" as any).select("*"),
      supabase.from("profiles" as any).select("*"),
      supabase.from("class_attendance" as any).select("*").order("confirmed_at", { ascending: false }),
      supabase.from("parent_child_links" as any).select("*"),
      supabase.from("subscription_registrations" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles" as any).select("*"),
      supabase.from("pix_stats" as any).select("*").limit(1).maybeSingle(),
      supabase.from("user_permissions" as any).select("*"),
    ]);

    setEnrollments((enrollRes.data as any[]) || []);
    setDonations((donRes.data as any[]) || []);
    setClasses((classRes.data as any[]) || []);
    setUsers((usersRes.data as any[]) || []);
    setAttendance((attendanceRes.data as any[]) || []);
    setParentLinks((linksRes.data as any[]) || []);
    const subscriptionData = (subsRes.data as any[]) || [];
    setSubscriptions(subscriptionData);
    setSubscriptionAmounts(Object.fromEntries(subscriptionData.map((s: any) => [s.id, s.monthly_amount ? String(s.monthly_amount) : ""])));
    const rolesMap: Record<string, string> = {};
    ((rolesRes.data as any[]) || []).forEach((r: any) => {
      // priorizar admin sobre outros papéis
      if (rolesMap[r.user_id] !== "admin") rolesMap[r.user_id] = r.role;
    });
    setUserRoles(rolesMap);
    const permsMap: Record<string, boolean> = {};
    ((permsRes.data as any[]) || []).forEach((p: any) => { permsMap[p.user_id] = !!p.can_enroll_classes; });
    setPermissions(permsMap);
    const pixData = (pixRes.data as any) || null;
    setPixStats(pixData);
    if (pixData) {
      setPixStatsForm({
        month_goal: String(pixData.month_goal ?? ""),
        current_amount: String(pixData.current_amount ?? ""),
        donor_count: String(pixData.donor_count ?? ""),
        month_label: pixData.month_label ?? "",
      });
    }
    setLoading(false);
  };

  const handleChangeRole = async (userId: string, newRole: "admin" | "user") => {
    // remove papéis existentes do usuário
    const { error: delErr } = await supabase.from("user_roles" as any).delete().eq("user_id", userId);
    if (delErr) {
      toast({ title: "Erro ao atualizar papel", description: delErr.message, variant: "destructive" });
      return;
    }
    const { error: insErr } = await supabase.from("user_roles" as any).insert({ user_id: userId, role: newRole } as any);
    if (insErr) {
      toast({ title: "Erro ao definir papel", description: insErr.message, variant: "destructive" });
      return;
    }
    setUserRoles((prev) => ({ ...prev, [userId]: newRole }));
    toast({ title: "Papel atualizado", description: newRole === "admin" ? "Usuário agora é Administrador" : "Usuário agora é Usuário comum" });
  };

  const openNewClass = () => {
    setEditingClassId(null);
    setClassForm({ title: "", address: "", day_of_week: "", time_slot: "", max_capacity: "30" });
    setShowClassForm(true);
  };

  const openEditClass = (c: any) => {
    setEditingClassId(c.id);
    setClassForm({
      title: c.title || c.category || "",
      address: c.address || "",
      day_of_week: c.day_of_week || "",
      time_slot: c.time_slot || "",
      max_capacity: c.max_capacity ? String(c.max_capacity) : "30",
    });
    setShowClassForm(true);
  };

  const handleSaveClass = async () => {
    if (!classForm.title.trim() || !classForm.day_of_week || !classForm.time_slot) {
      toast({ title: "Preencha nome, dia e horário", variant: "destructive" });
      return;
    }
    const payload = {
      title: classForm.title.trim(),
      address: classForm.address.trim() || null,
      day_of_week: classForm.day_of_week,
      time_slot: classForm.time_slot,
      max_capacity: parseInt(classForm.max_capacity) || 30,
    };
    const { error } = editingClassId
      ? await supabase.from("classes" as any).update(payload as any).eq("id", editingClassId)
      : await supabase.from("classes" as any).insert(payload as any);

    if (error) {
      toast({ title: "Erro ao salvar aula", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingClassId ? "Aula atualizada!" : "Aula criada com sucesso!" });
      setShowClassForm(false);
      setEditingClassId(null);
      setClassForm({ title: "", address: "", day_of_week: "", time_slot: "", max_capacity: "30" });
      loadData();
    }
  };

  const handleTogglePermission = async (userId: string, allowed: boolean) => {
    const { error } = await supabase
      .from("user_permissions" as any)
      .upsert({ user_id: userId, can_enroll_classes: allowed } as any, { onConflict: "user_id" });
    if (error) {
      toast({ title: "Erro ao atualizar permissão", description: error.message, variant: "destructive" });
      return;
    }
    setPermissions((prev) => ({ ...prev, [userId]: allowed }));
    toast({ title: allowed ? "Inscrição em aulas liberada" : "Inscrição em aulas bloqueada" });
  };

  const handleDeleteClass = async (id: string) => {
    const { error } = await supabase.from("classes" as any).delete().eq("id", id);
    if (error) toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Aula excluída" });
      loadData();
    }
  };

  const handleToggleAttendance = async (enrollment: any, date?: string) => {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const existing = attendance.find((a) => a.enrollment_id === enrollment.id && a.class_date === targetDate);

    const { error } = existing
      ? await supabase.from("class_attendance" as any).delete().eq("id", existing.id)
      : await supabase.from("class_attendance" as any).insert({
          enrollment_id: enrollment.id,
          class_id: enrollment.class_id,
          student_user_id: enrollment.user_id,
          confirmed_by: user!.id,
          class_date: targetDate,
        } as any);

    if (error) toast({ title: "Erro ao atualizar presença", description: error.message, variant: "destructive" });
    else {
      toast({ title: existing ? "Presença removida" : "Presença confirmada" });
      loadData();
    }
  };

  const handleCreateLink = async () => {
    if (!linkForm.parent_user_id || !linkForm.child_user_id) {
      toast({ title: "Selecione responsável e aluno", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("parent_child_links" as any).insert(linkForm as any);
    if (error) toast({ title: "Erro ao vincular", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Responsável vinculado ao aluno" });
      setShowLinkForm(false);
      setLinkForm({ parent_user_id: "", child_user_id: "", relationship: "responsável" });
      loadData();
    }
  };

  const handleUpdateSubscriptionAmount = async (id: string) => {
    const amount = Number(subscriptionAmounts[id]);
    if (!amount || amount <= 0) {
      toast({ title: "Informe um valor válido", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("subscription_registrations" as any).update({ monthly_amount: amount } as any).eq("id", id);
    if (error) toast({ title: "Erro ao atualizar valor", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Valor mensal atualizado" });
      loadData();
    }
  };

  const handleUpdateSubscriptionStatus = async (id: string, status: "pago" | "atrasado") => {
    const { error } = await supabase.from("subscription_registrations" as any).update({ payment_status: status } as any).eq("id", id);
    if (error) toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
    else {
      toast({ title: status === "pago" ? "Marcado como pago" : "Marcado como atrasado" });
      loadData();
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm("Remover esta assinatura? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("subscription_registrations" as any).delete().eq("id", id);
    if (error) toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Assinatura removida" });
      loadData();
    }
  };

  const handleSavePixStats = async () => {
    const goal = Number(pixStatsForm.month_goal);
    const amount = Number(pixStatsForm.current_amount);
    const donors = Number(pixStatsForm.donor_count);
    if (!goal || goal <= 0 || isNaN(amount) || amount < 0 || isNaN(donors) || donors < 0 || !pixStatsForm.month_label.trim()) {
      toast({ title: "Preencha todos os campos corretamente", variant: "destructive" });
      return;
    }

    const payload = {
      month_goal: goal,
      current_amount: amount,
      donor_count: donors,
      month_label: pixStatsForm.month_label.trim(),
    };

    const { error } = pixStats
      ? await supabase.from("pix_stats" as any).update(payload as any).eq("id", pixStats.id)
      : await supabase.from("pix_stats" as any).insert(payload as any);

    if (error) toast({ title: "Erro ao salvar estatísticas", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Estatísticas PIX atualizadas!" });
      loadData();
    }
  };

  const tabs = [
    { id: "alunos" as AdminTab, label: "Alunos", icon: Users, count: enrollments.length },
    { id: "doacoes" as AdminTab, label: "Doações", icon: DollarSign, count: donations.length },
    { id: "assinaturas" as AdminTab, label: "Assinaturas", icon: CalendarDays, count: subscriptions.length },
    { id: "aulas" as AdminTab, label: "Aulas", icon: BookOpen, count: classes.length },
    { id: "eventos" as AdminTab, label: "Eventos", icon: CalendarDays, count: 0 },
    { id: "presencas" as AdminTab, label: "Presenças", icon: UserCheck, count: attendance.length },
    
    { id: "conteudo" as AdminTab, label: "Conteúdo", icon: FileText, count: 0 },
    { id: "noticias" as AdminTab, label: "Notícias", icon: Newspaper, count: 0 },
    { id: "apadrinhar" as AdminTab, label: "Apadrinhar", icon: Sparkles, count: 0 },
    { id: "voluntarios" as AdminTab, label: "Voluntários", icon: HandHeart, count: 0 },
    { id: "locais" as AdminTab, label: "Locais", icon: MapPin, count: 0 },
    { id: "seguranca" as AdminTab, label: "Segurança", icon: Shield, count: users.length },
  ];

  const totalDonations = donations.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);

  const getEnrollmentsByClass = () => {
    const grouped: Record<string, any[]> = {};
    enrollments.forEach((e: any) => {
      const classInfo = e.classes;
      const key = classInfo ? `${classInfo.title || classInfo.category || "Aula"} - ${DAY_LABELS[classInfo.day_of_week] || classInfo.day_of_week} ${classInfo.time_slot}` : "Sem turma";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    });
    return grouped;
  };

  const getUserName = (userId: string) => {
    const profile = users.find((u: any) => u.user_id === userId);
    return profile?.display_name || "Usuário";
  };

  const filteredUsers = users.filter((u: any) =>
    (u.display_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-primary px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/")} className="text-primary-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-primary-foreground">Painel Administrativo</h1>
            <p className="text-primary-foreground/70 text-xs">Gestão da ONG Missão Vida</p>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id ? "bg-primary-foreground text-primary" : "bg-primary-foreground/10 text-primary-foreground/70"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-primary-foreground/10 text-primary-foreground/50"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : (
          <>
            {activeTab === "alunos" && (
              <div className="space-y-4">
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-semibold text-foreground text-sm mb-1">Total de Matrículas</h3>
                  <p className="text-3xl font-bold text-primary">{enrollments.length}</p>
                </div>

                {Object.entries(getEnrollmentsByClass()).map(([className, students]) => (
                  <div key={className} className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/30">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground text-sm">{className}</h3>
                        <Badge variant="secondary" className="text-xs">{students.length} alunos</Badge>
                      </div>
                    </div>
                    <div className="divide-y divide-border">
                      {students.map((s: any) => (
                        <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{getUserName(s.user_id)}</p>
                            <p className="text-xs text-muted-foreground">Inscrito em {new Date(s.enrolled_at).toLocaleDateString("pt-BR")}</p>
                          </div>
                          <Badge variant={attendance.some((a) => a.enrollment_id === s.id && a.class_date === today) ? "default" : "secondary"} className="text-[10px]">
                            {attendance.some((a) => a.enrollment_id === s.id && a.class_date === today) ? "Presente" : "Pendente"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {enrollments.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma matrícula encontrada</div>}
              </div>
            )}

            {activeTab === "doacoes" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <p className="text-xs text-muted-foreground">Total Arrecadado</p>
                    <p className="text-2xl font-bold text-primary">R$ {totalDonations.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <p className="text-xs text-muted-foreground">Nº de Doações</p>
                    <p className="text-2xl font-bold text-foreground">{donations.length}</p>
                  </div>
                </div>

                {/* PIX Stats Editor */}
                <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                  <h3 className="font-semibold text-foreground text-sm">Estatísticas da área PIX</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Meta do mês (R$)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={pixStatsForm.month_goal}
                        onChange={(e) => setPixStatsForm((prev) => ({ ...prev, month_goal: e.target.value }))}
                        className="w-full bg-muted rounded-lg px-3 py-2 text-foreground text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Valor arrecadado (R$)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={pixStatsForm.current_amount}
                        onChange={(e) => setPixStatsForm((prev) => ({ ...prev, current_amount: e.target.value }))}
                        className="w-full bg-muted rounded-lg px-3 py-2 text-foreground text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Nº de doadores</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={pixStatsForm.donor_count}
                        onChange={(e) => setPixStatsForm((prev) => ({ ...prev, donor_count: e.target.value }))}
                        className="w-full bg-muted rounded-lg px-3 py-2 text-foreground text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Mês/label</label>
                      <input
                        type="text"
                        value={pixStatsForm.month_label}
                        onChange={(e) => setPixStatsForm((prev) => ({ ...prev, month_label: e.target.value }))}
                        placeholder="Fevereiro 2026"
                        className="w-full bg-muted rounded-lg px-3 py-2 text-foreground text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSavePixStats} className="w-full gradient-primary text-primary-foreground">
                    Salvar estatísticas PIX
                  </Button>
                </div>

                {donations.length > 0 ? (
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/30"><h3 className="font-semibold text-foreground text-sm">Histórico de Doações</h3></div>
                    <div className="divide-y divide-border">
                      {donations.map((d: any) => (
                        <div key={d.id} className="px-4 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{d.donor_name || getUserName(d.user_id)}</p>
                            <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-primary">R$ {Number(d.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                            <Badge variant={d.status === "confirmed" ? "default" : "secondary"} className="text-[10px]">{d.status === "confirmed" ? "Confirmada" : "Pendente"}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma doação registrada</div>}
              </div>
            )}

            {activeTab === "assinaturas" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <p className="text-xs text-muted-foreground">Cadastros</p>
                    <p className="text-2xl font-bold text-primary">{subscriptions.length}</p>
                  </div>
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <p className="text-xs text-muted-foreground">Menores de 18</p>
                    <p className="text-2xl font-bold text-foreground">{subscriptions.filter((s: any) => s.is_minor).length}</p>
                  </div>
                </div>

                {subscriptions.length > 0 ? (
                  <div className="space-y-3">
                    {subscriptions.map((s: any) => (
                      <div key={s.id} className="bg-card rounded-xl border border-border p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm text-foreground">{s.subscriber_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.age} anos • Nasc. {new Date(s.birth_date).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {s.is_minor && <Badge variant="secondary" className="text-[10px]">Menor</Badge>}
                            <Badge variant={s.payment_status === "atrasado" ? "destructive" : "default"} className="text-[10px]">
                              {s.payment_status === "atrasado" ? "Atrasado" : "Pago"}
                            </Badge>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeleteSubscription(s.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={s.payment_status === "pago" ? "default" : "outline"}
                            className="flex-1 h-8 text-xs"
                            onClick={() => handleUpdateSubscriptionStatus(s.id, "pago")}
                          >
                            Marcar Pago
                          </Button>
                          <Button
                            size="sm"
                            variant={s.payment_status === "atrasado" ? "destructive" : "outline"}
                            className="flex-1 h-8 text-xs"
                            onClick={() => handleUpdateSubscriptionStatus(s.id, "atrasado")}
                          >
                            Marcar Atrasado
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>📞 {s.phone}</p>
                          <p>📍 {s.address}</p>
                          <div className="pt-2 space-y-2">
                            <Label className="text-xs text-foreground">Valor mensal autorizado</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="1"
                                step="0.01"
                                value={subscriptionAmounts[s.id] || ""}
                                onChange={(e) => setSubscriptionAmounts((current) => ({ ...current, [s.id]: e.target.value }))}
                                className="h-9 text-sm"
                              />
                              <Button size="sm" onClick={() => handleUpdateSubscriptionAmount(s.id)}>Salvar</Button>
                            </div>
                            <p>Vence dia {s.due_day}</p>
                          </div>
                          <p>📅 Início: {new Date(s.start_date).toLocaleDateString("pt-BR")}</p>
                        </div>
                        {s.is_minor && (
                          <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground space-y-0.5">
                            <p className="font-medium text-foreground">Responsável</p>
                            <p>{s.guardian_name} • CPF {s.guardian_document}</p>
                            <Badge variant={s.guardian_authorized ? "default" : "destructive"} className="text-[10px] mt-1">
                              {s.guardian_authorized ? "Autorizado" : "Sem autorização"}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <div className="text-center py-8 text-muted-foreground text-sm">Nenhum cadastro de assinatura ainda</div>}
              </div>
            )}

            {activeTab === "aulas" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Turmas Cadastradas</h3>
                  <Dialog open={showClassForm} onOpenChange={(open) => { setShowClassForm(open); if (!open) setEditingClassId(null); }}>
                    <DialogTrigger asChild><Button size="sm" className="gap-1.5" onClick={openNewClass}><Plus className="h-4 w-4" /> Nova Aula</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>{editingClassId ? "Editar Aula" : "Criar Nova Aula"}</DialogTitle></DialogHeader>
                      <div className="space-y-4 mt-2">
                        
                        <div><Label>Nome da aula</Label><Input placeholder="Ex: Futebol Infantil - Turma A" value={classForm.title} onChange={(e) => setClassForm({ ...classForm, title: e.target.value })} maxLength={120} /></div>
                        <div><Label>Endereço</Label><Input placeholder="Rua, número, bairro, cidade" value={classForm.address} onChange={(e) => setClassForm({ ...classForm, address: e.target.value })} maxLength={200} /></div>
                        <div><Label>Dia da Semana</Label><Select value={classForm.day_of_week} onValueChange={(v) => setClassForm({ ...classForm, day_of_week: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{Object.entries(DAY_LABELS).slice(0, 7).map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label>Horário</Label><Input placeholder="Ex: 14:00 - 16:00" value={classForm.time_slot} onChange={(e) => setClassForm({ ...classForm, time_slot: e.target.value })} /></div>
                        <div><Label>Quantidade máxima de alunos</Label><Input type="number" min="1" value={classForm.max_capacity} onChange={(e) => setClassForm({ ...classForm, max_capacity: e.target.value })} /></div>
                        <Button onClick={handleSaveClass} className="w-full">{editingClassId ? "Salvar alterações" : "Criar Aula"}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {classes.map((c: any) => {
                  const enrolled = enrollments.filter((e: any) => e.class_id === c.id).length;
                  return (
                    <div key={c.id} className="bg-card rounded-xl p-4 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div><h4 className="font-semibold text-foreground text-sm">{c.title || c.category || "Aula"}</h4><p className="text-xs text-muted-foreground">{DAY_LABELS[c.day_of_week] || c.day_of_week} • {c.time_slot}</p>{c.address && <p className="text-xs text-muted-foreground mt-0.5">📍 {c.address}</p>}</div>
                        <div className="flex items-center"><Button variant="ghost" size="icon" onClick={() => openEditClass(c)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClass(c.id)}><Trash2 className="h-4 w-4" /></Button></div>
                      </div>
                      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">{enrolled}/{c.max_capacity || "∞"} alunos</span></div><div className="h-1.5 flex-1 mx-3 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((enrolled / (c.max_capacity || 30)) * 100, 100)}%` }} /></div></div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "eventos" && <EventsAdmin />}



            {activeTab === "presencas" && (
              <div className="space-y-4">
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-semibold text-foreground text-sm mb-1">Presenças de Hoje</h3>
                  <p className="text-3xl font-bold text-primary">{attendance.filter((a) => a.class_date === today).length}</p>
                </div>

                {Object.entries(getEnrollmentsByClass()).map(([className, students]) => {
                  const classId = students[0]?.class_id;
                  const selectedDate = attendanceDates[classId] || today;
                  return (
                    <div key={className} className="bg-card rounded-xl border border-border overflow-hidden">
                      <div className="p-4 border-b border-border bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-foreground text-sm">{className}</h3>
                          <Badge variant="secondary" className="text-xs">{students.length} alunos</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Data da aula:</Label>
                          <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setAttendanceDates((curr) => ({ ...curr, [classId]: e.target.value }))}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="divide-y divide-border">
                        {students.map((s: any) => {
                          const present = attendance.some((a) => a.enrollment_id === s.id && a.class_date === selectedDate);
                          return (
                            <div key={s.id} className="px-4 py-3 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-foreground">{getUserName(s.user_id)}</p>
                                <p className="text-xs text-muted-foreground">Inscrito em {new Date(s.enrolled_at).toLocaleDateString("pt-BR")}</p>
                              </div>
                              <Button
                                size="sm"
                                variant={present ? "default" : "outline"}
                                onClick={() => handleToggleAttendance(s, selectedDate)}
                                className="gap-1.5"
                              >
                                <UserCheck className="h-4 w-4" />
                                {present ? "Presente" : "Confirmar"}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {enrollments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma matrícula encontrada</div>
                )}
              </div>
            )}

            {activeTab === "responsaveis" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between"><h3 className="font-semibold text-foreground">Vínculos de Pais</h3><Dialog open={showLinkForm} onOpenChange={setShowLinkForm}><DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Vincular</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Vincular responsável</DialogTitle></DialogHeader><div className="space-y-4 mt-2"><div><Label>Responsável</Label><Select value={linkForm.parent_user_id} onValueChange={(v) => setLinkForm({ ...linkForm, parent_user_id: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{users.map((u) => <SelectItem key={u.user_id} value={u.user_id}>{u.display_name || u.user_id}</SelectItem>)}</SelectContent></Select></div><div><Label>Aluno/filho</Label><Select value={linkForm.child_user_id} onValueChange={(v) => setLinkForm({ ...linkForm, child_user_id: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{users.map((u) => <SelectItem key={u.user_id} value={u.user_id}>{u.display_name || u.user_id}</SelectItem>)}</SelectContent></Select></div><div><Label>Relação</Label><Input value={linkForm.relationship} onChange={(e) => setLinkForm({ ...linkForm, relationship: e.target.value })} /></div><Button onClick={handleCreateLink} className="w-full">Salvar vínculo</Button></div></DialogContent></Dialog></div>
                {parentLinks.map((link) => <div key={link.id} className="bg-card rounded-xl p-4 border border-border"><p className="text-sm font-semibold text-foreground">{getUserName(link.parent_user_id)}</p><p className="text-xs text-muted-foreground">Responsável por {getUserName(link.child_user_id)} • {link.relationship}</p></div>)}
                {parentLinks.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">Nenhum vínculo cadastrado</div>}
              </div>
            )}

            {activeTab === "conteudo" && <ContentManager />}

            {activeTab === "noticias" && <NewsAdmin />}

            {activeTab === "apadrinhar" && <SponsorshipAdmin />}

            {activeTab === "voluntarios" && <VolunteerAdmin />}

            {activeTab === "locais" && <CollectionPointsAdmin />}

            {activeTab === "seguranca" && (
              <div className="space-y-4">
                <div className="bg-card rounded-xl p-4 border border-border"><h3 className="font-semibold text-foreground text-sm mb-1">Usuários Cadastrados</h3><p className="text-3xl font-bold text-primary">{users.length}</p></div>
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar usuário..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="p-4 border-b border-border bg-muted/30"><h3 className="font-semibold text-foreground text-sm">Lista de Usuários</h3></div>
                  <div className="divide-y divide-border">
                    {filteredUsers.map((u: any) => {
                      const role = userRoles[u.user_id] || "user";
                      const isSelf = user?.id === u.user_id;
                      return (
                        <div key={u.id} className="px-4 py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><span className="text-xs font-bold text-primary">{(u.display_name || "U")[0].toUpperCase()}</span></div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{u.display_name || "Sem nome"}{isSelf && <span className="text-xs text-muted-foreground"> (você)</span>}</p>
                              <p className="text-xs text-muted-foreground">Desde {new Date(u.created_at).toLocaleDateString("pt-BR")}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Select value={role} onValueChange={(v) => handleChangeRole(u.user_id, v as "admin" | "user")} disabled={isSelf}>
                              <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Usuário</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-muted-foreground whitespace-nowrap">Pode se inscrever em aulas</span>
                              <Switch
                                checked={role === "admin" || !!permissions[u.user_id]}
                                disabled={role === "admin"}
                                onCheckedChange={(checked) => handleTogglePermission(u.user_id, checked)}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border"><div className="flex items-center gap-2 mb-2"><Shield className="h-4 w-4 text-primary" /><h3 className="font-semibold text-foreground text-sm">Informações de Segurança</h3></div><div className="space-y-2 text-xs text-muted-foreground"><p>• Usuários não podem alterar configurações do app</p><p>• Dados protegidos por políticas de acesso</p><p>• Autenticação obrigatória para todas as funcionalidades</p><p>• Proteção contra senhas vazadas ativada</p><p>• Inscrição em aulas exige autorização do administrador</p></div></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
