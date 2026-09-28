import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Heart, ExternalLink, CheckCircle2, Sparkles, Users } from "lucide-react";
import { openExternal } from "@/lib/native";

interface Child {
  id: string;
  name: string;
  cause: string;
  description: string | null;
  amount: number;
  payment_link: string;
}

const SponsorshipSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mySponsorships, setMySponsorships] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: publicData } = await supabase.functions.invoke("public-donation-data");
    const list = (publicData?.children as Child[]) || [];
    setChildren(list);
    setCounts(publicData?.sponsor_counts || {});

    if (user) {
      const { data: mySponsors } = await supabase
        .from("sponsorship_sponsors" as any)
        .select("child_id")
        .eq("user_id", user.id);
      const mine = new Set<string>();
      (mySponsors as any[] || []).forEach((s) => mine.add(s.child_id));
      setMySponsorships(mine);
    } else {
      setMySponsorships(new Set());
    }
    setLoading(false);
  };


  useEffect(() => {
    load();
  }, [user?.id]);

  const handleSponsor = async (child: Child) => {
    if (!user) {
      toast({ title: "Faça login", description: "Entre para apadrinhar uma criança.", variant: "destructive" });
      return;
    }
    if (mySponsorships.has(child.id)) {
      openExternal(child.payment_link);
      return;
    }

    const { error } = await supabase
      .from("sponsorship_sponsors" as any)
      .insert({ child_id: child.id, user_id: user.id } as any);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    openExternal(child.payment_link);
    toast({ title: "Obrigado por apadrinhar! ❤️", description: `Você está ajudando ${child.name}.` });
    load();
  };

  if (loading) return <div className="text-center text-muted-foreground py-8">Carregando...</div>;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <h2 className="font-display text-lg font-semibold text-foreground">Apadrinhe uma criança</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cada criança tem uma necessidade específica. Escolha uma e contribua diretamente pelo link de pagamento. Várias pessoas podem apadrinhar a mesma criança.
        </p>
      </div>

      {children.map((child) => {
        const sponsoredByMe = mySponsorships.has(child.id);
        const total = counts[child.id] || 0;
        return (
          <div key={child.id} className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{child.name}</h3>
                <p className="text-sm text-primary font-medium mt-0.5">{child.cause}</p>
                {child.description && (
                  <p className="text-xs text-muted-foreground mt-1">{child.description}</p>
                )}
                <p className="text-lg font-bold text-foreground mt-2">
                  R$ {Number(child.amount).toFixed(2).replace(".", ",")}
                </p>
                {total > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Users className="h-3 w-3" />
                    <span>{total} {total === 1 ? "padrinho" : "padrinhos"}</span>
                  </div>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Heart className={`h-5 w-5 ${sponsoredByMe ? "text-primary fill-primary" : "text-primary"}`} />
              </div>
            </div>

            {sponsoredByMe && (
              <div className="mt-3 flex items-center gap-2 text-sm bg-success/10 rounded-lg px-3 py-2 border border-success/30">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-foreground">Você apadrinhou esta criança ❤️</span>
              </div>
            )}
            <Button className="w-full mt-3 gradient-primary text-primary-foreground" onClick={() => handleSponsor(child)}>
              {sponsoredByMe ? "Doar novamente" : "Apadrinhar e doar"} <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        );
      })}

      {children.length === 0 && (
        <div className="text-center text-muted-foreground py-8 bg-card rounded-xl border border-border">
          Nenhuma criança disponível no momento.
        </div>
      )}
    </div>
  );
};

export default SponsorshipSection;
