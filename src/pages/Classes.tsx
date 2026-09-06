import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, GraduationCap, Calendar, Clock, MapPin, XCircle, BookOpen, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const defaultLocation = {
  name: "Missão Vida",
  address: "R. Jaci, 314 - Cidade Ariston Estela Azevedo, Carapicuíba - SP, 06396-190",
};

const dayOrder: Record<string, number> = {
  "Domingo": 0, "Segunda-feira": 1, "Terça-feira": 2, "Quarta-feira": 3,
  "Quinta-feira": 4, "Sexta-feira": 5, "Sábado": 6,
  "Segunda": 1, "Terça": 2, "Quarta": 3, "Quinta": 4, "Sexta": 5,
  segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6, domingo: 0,
};

function getNextOccurrence(dayOfWeek: string, timeSlot: string): Date | null {
  const dayNum = dayOrder[dayOfWeek];
  if (dayNum === undefined) return null;

  const now = new Date();
  const today = now.getDay();
  let daysUntil = dayNum - today;
  if (daysUntil < 0) daysUntil += 7;

  const timeParts = (timeSlot || "").match(/(\d{1,2}):(\d{2})/);
  if (!timeParts) return null;

  const next = new Date(now);
  next.setDate(now.getDate() + daysUntil);
  next.setHours(parseInt(timeParts[1]), parseInt(timeParts[2]), 0, 0);
  if (next <= now) next.setDate(next.getDate() + 7);
  return next;
}

function formatTimeRemaining(target: Date): string {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return "";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `em ${days}d ${hours}h`;
  if (hours > 0) return `em ${hours}h ${minutes}min`;
  return `em ${minutes}min`;
}

type TabType = "aulas" | "minhas";

const Classes = () => {
  const [activeTab, setActiveTab] = useState<TabType>("aulas");
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes" as any).select("*");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: canEnroll = false } = useQuery({
    queryKey: ["class-permission", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_permissions" as any)
        .select("can_enroll_classes")
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!(data as any)?.can_enroll_classes;
    },
    enabled: !!user,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_enrollments" as any)
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const enrollMutation = useMutation({
    mutationFn: async (classId: string) => {
      const { error } = await supabase
        .from("class_enrollments" as any)
        .insert({ class_id: classId, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      toast({ title: "Inscrição realizada!", description: "Você foi inscrito na aula com sucesso." });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: async (classId: string) => {
      const { error } = await supabase
        .from("class_enrollments" as any)
        .delete()
        .eq("class_id", classId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      toast({ title: "Inscrição cancelada", description: "Sua inscrição foi removida." });
    },
  });

  const enrolledClassIds = useMemo(
    () => new Set(enrollments.map((e: any) => e.class_id)),
    [enrollments]
  );

  const enrolledClasses = useMemo(() => {
    return classes
      .filter((c: any) => enrolledClassIds.has(c.id))
      .map((c: any) => ({ ...c, nextOccurrence: getNextOccurrence(c.day_of_week, c.time_slot) }))
      .sort((a: any, b: any) => (a.nextOccurrence?.getTime() ?? 0) - (b.nextOccurrence?.getTime() ?? 0));
  }, [classes, enrolledClassIds]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-primary px-5 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="text-primary-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-xl font-bold text-primary-foreground">
            {activeTab === "minhas" ? "Minhas Aulas" : "Aulas"}
          </h1>
        </div>
        <p className="text-primary-foreground/70 text-sm">
          {activeTab === "minhas" ? "Aulas em que você está inscrito" : "Escolha uma aula para se inscrever"}
        </p>
      </div>

      <div className="px-5 -mt-4 relative z-10 space-y-3">
        <div className="flex gap-2 mb-1">
          <button
            onClick={() => setActiveTab("aulas")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "aulas"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-muted-foreground border border-border"
            }`}
          >
            <GraduationCap className="h-4 w-4 inline mr-1.5 -mt-0.5" />
            Aulas
          </button>
          <button
            onClick={() => setActiveTab("minhas")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all relative ${
              activeTab === "minhas"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-muted-foreground border border-border"
            }`}
          >
            <BookOpen className="h-4 w-4 inline mr-1.5 -mt-0.5" />
            Minhas Aulas
            {enrolledClasses.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {enrolledClasses.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "aulas" && (
          <div className="space-y-3">
            {!isAdmin && !canEnroll && (
              <div className="bg-accent/10 border border-accent/30 rounded-xl p-3">
                <p className="text-xs text-foreground">
                  Sua conta ainda não tem autorização para se inscrever em aulas. Peça a liberação a um administrador.
                </p>
              </div>
            )}
            {classes.length === 0 ? (
              <div className="bg-card rounded-xl p-8 border border-border text-center">
                <GraduationCap className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground text-sm">Nenhuma aula cadastrada</h3>
              </div>
            ) : (
              classes.map((cls: any) => {
                const isEnrolled = enrolledClassIds.has(cls.id);
                return (
                  <div
                    key={cls.id}
                    className={`bg-card rounded-xl p-4 border shadow-sm transition-all ${
                      isEnrolled ? "border-primary/40 bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground text-sm">{cls.title || cls.category || "Aula"}</h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{cls.day_of_week} • {cls.time_slot}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{cls.address || defaultLocation.address}</span>
                          </div>
                        </div>
                      </div>

                      {isAdmin ? (
                        <span className="text-xs text-muted-foreground italic whitespace-nowrap">
                          Admins não se inscrevem
                        </span>
                      ) : isEnrolled ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1.5"
                          onClick={() => unenrollMutation.mutate(cls.id)}
                          disabled={unenrollMutation.isPending}
                        >
                          <XCircle className="h-4 w-4" />
                          Sair
                        </Button>
                      ) : !canEnroll ? (
                        <span className="text-xs text-muted-foreground italic text-right max-w-[130px]">
                          Aguardando autorização do administrador
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => enrollMutation.mutate(cls.id)}
                          disabled={enrollMutation.isPending}
                        >
                          Inscrever-se
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "minhas" && (
          <div className="space-y-3">
            {enrolledClasses.length === 0 ? (
              <div className="bg-card rounded-xl p-8 border border-border text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground text-sm">Nenhuma inscrição</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Inscreva-se em uma aula para vê-la aqui
                </p>
                <Button size="sm" className="mt-4" onClick={() => setActiveTab("aulas")}>
                  Ver aulas
                </Button>
              </div>
            ) : (
              enrolledClasses.map((cls: any) => {
                const timeLeft = cls.nextOccurrence ? formatTimeRemaining(cls.nextOccurrence) : "";
                return (
                  <div key={cls.id} className="bg-card rounded-xl p-4 border border-primary/20 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground text-sm">{cls.title || cls.category || "Aula"}</h4>
                          <p className="text-xs text-muted-foreground">{cls.day_of_week} • {cls.time_slot}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1.5"
                        onClick={() => unenrollMutation.mutate(cls.id)}
                        disabled={unenrollMutation.isPending}
                      >
                        <XCircle className="h-4 w-4" />
                        Sair
                      </Button>
                    </div>

                    <div className="mt-3 flex items-center gap-4">
                      {timeLeft && (
                        <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-lg">
                          <Timer className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium text-primary">{timeLeft}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="text-xs">{cls.address || defaultLocation.name}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Classes;
