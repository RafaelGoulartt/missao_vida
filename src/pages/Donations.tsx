import { Heart, ArrowLeft, Copy, Check, QrCode, ReceiptText, MapPin, Navigation, ExternalLink, CalendarDays, PlayCircle, Sparkles } from "lucide-react";
import DonationCard from "@/components/DonationCard";
import SponsorshipSection from "@/components/SponsorshipSection";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PixCopyKey from "@/components/PixCopyKey";
import { useAuth } from "@/hooks/useAuth";
import { useSiteContent } from "@/hooks/useSiteContent";
import { toEmbedUrl } from "@/lib/siteContent";

const donationOptions = [
  { amount: 25, description: "Ajuda básica mensal", impact: "Alimenta 1 criança por 1 semana" },
  { amount: 50, description: "Contribuição solidária", impact: "Kit escolar completo para 1 aluno", popular: true },
  { amount: 100, description: "Apoio transformador", impact: "Cesta básica para 1 família" },
  { amount: 250, description: "Impacto real", impact: "Material para oficina comunitária" },
];

const PIX_KEY = "missaovida@pix.com";
const PIX_NAME = "Missão Vida";
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();
const subscriptionMonths = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
].map((name, index) => ({ name, index }));


const generatePixPayload = (amount: number) => {
  const amountStr = amount.toFixed(2);
  return `00020126360014BR.GOV.BCB.PIX0114${PIX_KEY}5204000053039865404${amountStr}5802BR5913${PIX_NAME}6009SAO PAULO62070503***6304`;
};

const Donations = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { get } = useSiteContent();
  const pixQrImage = get("pix_qrcode", "image");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showPix, setShowPix] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"pix" | "cupom" | "assinatura" | "apadrinhar">("pix");
  const [subscriptionAmount, setSubscriptionAmount] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [paidMonths, setPaidMonths] = useState<number[]>([]);
  const [subscriptionJoined, setSubscriptionJoined] = useState(false);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<Date | null>(null);
  const [showSubscriptionPix, setShowSubscriptionPix] = useState(false);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [subscriberName, setSubscriberName] = useState("");
  const [subscriberBirthDate, setSubscriberBirthDate] = useState("");
  const [subscriberPhone, setSubscriberPhone] = useState("");
  const [subscriberAddress, setSubscriberAddress] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianDocument, setGuardianDocument] = useState("");
  const [guardianAuthorized, setGuardianAuthorized] = useState(false);
  const [pixStats, setPixStats] = useState<{ month_goal: number; current_amount: number; donor_count: number; month_label: string } | null>(null);
  const [collectionPoints, setCollectionPoints] = useState<any[]>([]);

  useEffect(() => {
    const loadPixStats = async () => {
      const { data } = await supabase.functions.invoke("public-donation-data");
      if (data?.pix_stats) setPixStats(data.pix_stats);
    };
    loadPixStats();
    const loadPoints = async () => {
      const { data } = await supabase
        .from("collection_points" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      setCollectionPoints((data as any[]) || []);
    };
    loadPoints();
  }, []);


  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const subscriberAge = calculateAge(subscriberBirthDate);
  const isMinor = subscriberAge !== null && subscriberAge < 18;

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("subscription_registrations" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error || !data) return;
      const reg: any = data;
      setSubscriberName(reg.subscriber_name ?? "");
      setSubscriberBirthDate(reg.birth_date ?? "");
      setSubscriberPhone(reg.phone ?? "");
      setSubscriberAddress(reg.address ?? "");
      setSubscriptionAmount(reg.monthly_amount ? String(reg.monthly_amount) : "");
      setGuardianName(reg.guardian_name ?? "");
      setGuardianDocument(reg.guardian_document ?? "");
      setGuardianAuthorized(!!reg.guardian_authorized);
      if (reg.start_date) setSubscriptionStartDate(new Date(reg.start_date + "T00:00:00"));
      setSubscriptionJoined(true);
      setShowSubscriptionForm(false);
    })();
  }, [user]);

  const finalAmount = selectedAmount || (customAmount ? parseFloat(customAmount) : 0);

  const handleDonate = () => {
    if (finalAmount <= 0) {
      toast({ title: "Selecione um valor", description: "Escolha ou digite um valor para doar." });
      return;
    }
    setShowPix(true);
  };

  const handleCopyPix = () => {
    const payload = generatePixPayload(finalAmount);
    navigator.clipboard.writeText(payload);
    setCopied(true);
    toast({ title: "Código PIX copiado!", description: "Cole no app do seu banco para finalizar." });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleReset = () => {
    setShowPix(false);
    setSelectedAmount(null);
    setCustomAmount("");
    setCopied(false);
  };

  const subscriptionValue = subscriptionAmount ? parseFloat(subscriptionAmount) : 0;
  const selectedSubscriptionMonth = subscriptionMonths[selectedMonth];
  const subscriptionPayload = subscriptionValue > 0 ? generatePixPayload(subscriptionValue) : "";

  const getSubscriptionDueDate = (monthIndex: number) => {
    const startDate = subscriptionStartDate || new Date();
    const startDay = startDate.getDate();
    const lastDayOfMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
    return new Date(currentYear, monthIndex, Math.min(startDay, lastDayOfMonth));
  };

  const getMonthStatus = (monthIndex: number) => {
    const dueDate = getSubscriptionDueDate(monthIndex);
    if (paidMonths.includes(monthIndex)) return { label: "Pago", className: "bg-success text-success-foreground" };
    if (dueDate < new Date()) return { label: "Atrasado", className: "bg-destructive text-destructive-foreground" };
    return { label: "Resta pagar", className: "bg-warning text-warning-foreground" };
  };

  const handleJoinSubscription = () => {
    setShowSubscriptionForm(true);
    setShowSubscriptionPix(false);
  };

  const handleConfirmSubscriptionRegistration = async () => {
    if (!subscriberName.trim()) {
      toast({ title: "Informe seu nome", description: "Preencha o nome completo." });
      return;
    }
    if (!subscriberBirthDate || subscriberAge === null) {
      toast({ title: "Informe a data de nascimento", description: "Digite uma data válida." });
      return;
    }
    if (!subscriberPhone.trim()) {
      toast({ title: "Informe o telefone", description: "Preencha um número de telefone válido." });
      return;
    }
    if (!subscriberAddress.trim()) {
      toast({ title: "Informe o endereço", description: "Preencha seu endereço completo." });
      return;
    }
    if (subscriptionValue <= 0) {
      toast({ title: "Informe o valor mensal", description: "Digite o valor inicial da assinatura." });
      return;
    }
    if (isMinor) {
      if (!guardianName.trim() || !guardianDocument.trim() || !guardianAuthorized) {
        toast({
          title: "Autorização necessária",
          description: "Para menores de 18 anos é preciso preencher os dados do responsável e confirmar a autorização.",
          variant: "destructive",
        });
        return;
      }
    }

    const startDate = new Date();
    const { error } = await supabase.from("subscription_registrations" as any).insert({
      user_id: user?.id ?? null,
      subscriber_name: subscriberName.trim(),
      birth_date: subscriberBirthDate,
      age: subscriberAge,
      phone: subscriberPhone.trim(),
      address: subscriberAddress.trim(),
      monthly_amount: subscriptionValue,
      start_date: startDate.toISOString().slice(0, 10),
      due_day: startDate.getDate(),
      is_minor: isMinor,
      guardian_name: isMinor ? guardianName.trim() : null,
      guardian_document: isMinor ? guardianDocument.trim() : null,
      guardian_authorized: isMinor ? guardianAuthorized : false,
    } as any);

    if (error) {
      toast({ title: "Erro ao salvar cadastro", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Cadastro enviado!", description: "Seus dados foram registrados com segurança." });
    setSubscriptionJoined(true);
    setShowSubscriptionForm(false);
    setSubscriptionStartDate(startDate);
    setSelectedMonth(currentMonth);
    setShowSubscriptionPix(false);
  };

  const handleOpenSubscriptionMonth = (monthIndex: number) => {
    if (subscriptionValue <= 0) {
      toast({ title: "Informe um valor", description: "Digite o valor da assinatura mensal." });
      return;
    }
    setSelectedMonth(monthIndex);
    setShowSubscriptionPix(true);
  };

  const handleCopySubscriptionPix = () => {
    navigator.clipboard.writeText(subscriptionPayload);
    setPaidMonths((months) => months.includes(selectedMonth) ? months : [...months, selectedMonth]);
    toast({ title: "Código PIX copiado!", description: "Após o pagamento, o mês ficará marcado como pago neste aparelho." });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-primary-foreground">{get("donations_header", "title")}</h1>
            <p className="text-primary-foreground/70 text-sm">{get("donations_header", "subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button onClick={() => setActiveTab("pix")} className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "pix" ? "bg-primary text-primary-foreground shadow-md" : "bg-card text-muted-foreground border border-border"}`}>
            <QrCode className="h-4 w-4 inline mr-1.5 -mt-0.5" /> PIX
          </button>
          <button onClick={() => setActiveTab("assinatura")} className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "assinatura" ? "bg-primary text-primary-foreground shadow-md" : "bg-card text-muted-foreground border border-border"}`}>
            <CalendarDays className="h-4 w-4 inline mr-1.5 -mt-0.5" /> Assinatura
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => setActiveTab("apadrinhar")} className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "apadrinhar" ? "bg-primary text-primary-foreground shadow-md" : "bg-card text-muted-foreground border border-border"}`}>
            <Sparkles className="h-4 w-4 inline mr-1.5 -mt-0.5" /> Apadrinhar
          </button>
          <button onClick={() => setActiveTab("cupom")} className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "cupom" ? "bg-primary text-primary-foreground shadow-md" : "bg-card text-muted-foreground border border-border"}`}>
            <ReceiptText className="h-4 w-4 inline mr-1.5 -mt-0.5" /> Cupom fiscal
          </button>
        </div>

        {activeTab === "apadrinhar" ? (
          <SponsorshipSection />
        ) : activeTab === "cupom" ? (
          <div className="space-y-4 animate-fade-in-up">
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <ReceiptText className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-display text-lg font-semibold text-foreground">Doação de cupom fiscal</h2>
              <p className="text-sm text-muted-foreground mt-1">Entregue seus cupons fiscais em um dos pontos de coleta para apoiar os projetos da ONG.</p>
            </div>
            {collectionPoints.length === 0 ? (
              <div className="bg-card rounded-xl p-6 border border-border text-center text-sm text-muted-foreground">
                Nenhum ponto de coleta cadastrado no momento.
              </div>
            ) : collectionPoints.map((point: any) => (
              <div key={point.id} className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-foreground">{point.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{point.address}</p>
                  </div>
                </div>
                {point.maps_url && (
                  <Button className="w-full mt-3" variant="outline" asChild>
                    <a href={point.maps_url} target="_blank" rel="noopener noreferrer">
                      <Navigation className="h-4 w-4 mr-2" /> Abrir localização <ExternalLink className="h-3.5 w-3.5 ml-2" />
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : activeTab === "assinatura" ? (
          <div className="space-y-4 animate-fade-in-up">
            {!subscriptionJoined && !showSubscriptionForm ? (
              <div className="space-y-4">
                <div className="bg-card rounded-xl p-4 border border-border">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="font-display text-lg font-semibold text-foreground">{get("donations_subscription_intro", "title")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{get("donations_subscription_intro", "description")}</p>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border">
                  {get("donations_subscription_intro", "video_url") ? (
                    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                      <iframe
                        className="absolute inset-0 w-full h-full rounded-xl"
                        src={toEmbedUrl(get("donations_subscription_intro", "video_url"))}
                        title="Vídeo explicativo"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl bg-muted border border-border flex flex-col items-center justify-center text-muted-foreground">
                      <PlayCircle className="h-10 w-10 mb-2" />
                      <p className="text-sm font-medium">{get("donations_subscription_intro", "video_placeholder")}</p>
                    </div>
                  )}
                </div>
                <Button className="w-full h-12 gradient-primary text-primary-foreground" onClick={handleJoinSubscription}>
                  Quero participar da assinatura
                </Button>
              </div>
            ) : showSubscriptionForm ? (
              <div className="space-y-4">
                <div className="bg-card rounded-xl p-4 border border-border">
                  <Button variant="ghost" className="-ml-2 mb-2" onClick={() => setShowSubscriptionForm(false)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                  </Button>
                  <h2 className="font-display text-lg font-semibold text-foreground">Cadastro do assinante</h2>
                  <p className="text-sm text-muted-foreground mt-1">Preencha seus dados para iniciar o programa de assinatura.</p>
                </div>

                <div className="bg-card rounded-xl p-4 border border-border space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Nome completo</label>
                    <input
                      type="text"
                      value={subscriberName}
                      onChange={(e) => setSubscriberName(e.target.value)}
                      placeholder="Seu nome"
                      maxLength={120}
                      className="w-full bg-muted rounded-lg px-3 py-2.5 text-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Data de nascimento</label>
                    <input
                      type="date"
                      value={subscriberBirthDate}
                      onChange={(e) => setSubscriberBirthDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full bg-muted rounded-lg px-3 py-2.5 text-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  {subscriberAge !== null && (
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Idade</label>
                      <div className="bg-muted rounded-lg px-3 py-2.5 text-foreground font-semibold">
                        {subscriberAge} {subscriberAge === 1 ? "ano" : "anos"}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone</label>
                    <input
                      type="tel"
                      value={subscriberPhone}
                      onChange={(e) => setSubscriberPhone(e.target.value)}
                      placeholder="(11) 90000-0000"
                      maxLength={20}
                      className="w-full bg-muted rounded-lg px-3 py-2.5 text-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Endereço</label>
                    <textarea
                      value={subscriberAddress}
                      onChange={(e) => setSubscriberAddress(e.target.value)}
                      placeholder="Rua, número, bairro, cidade - UF"
                      maxLength={250}
                      rows={2}
                      className="w-full bg-muted rounded-lg px-3 py-2.5 text-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Valor mensal inicial</label>
                    <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/30">
                      <span className="text-muted-foreground font-medium">R$</span>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="0,00"
                        value={subscriptionAmount}
                        onChange={(e) => setSubscriptionAmount(e.target.value)}
                        className="flex-1 bg-transparent text-foreground font-semibold placeholder:text-muted-foreground/50 border-0 outline-none"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Depois do cadastro, alterações no valor mensal só poderão ser feitas pela administração.</p>
                  </div>
                </div>

                {isMinor && (
                  <div className="bg-warning/10 rounded-xl p-4 border border-warning/30 space-y-3">
                    <p className="text-sm font-semibold text-foreground">Autorização do responsável</p>
                    <p className="text-xs text-muted-foreground">Por ser menor de 18 anos, é necessária a autorização de um responsável legal.</p>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Nome do responsável</label>
                      <input
                        type="text"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        placeholder="Nome completo do responsável"
                        maxLength={120}
                        className="w-full bg-card rounded-lg px-3 py-2.5 text-foreground border border-border outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">CPF do responsável</label>
                      <input
                        type="text"
                        value={guardianDocument}
                        onChange={(e) => setGuardianDocument(e.target.value)}
                        placeholder="000.000.000-00"
                        maxLength={20}
                        className="w-full bg-card rounded-lg px-3 py-2.5 text-foreground border border-border outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={guardianAuthorized}
                        onChange={(e) => setGuardianAuthorized(e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-primary"
                      />
                      <span className="text-xs text-foreground">Eu, responsável legal, autorizo a participação do menor no programa de assinatura.</span>
                    </label>
                  </div>
                )}

                <Button className="w-full h-12 gradient-primary text-primary-foreground" onClick={handleConfirmSubscriptionRegistration}>
                  Confirmar cadastro
                </Button>
              </div>
            ) : showSubscriptionPix ? (
              <div className="bg-card rounded-2xl p-5 border border-border flex flex-col items-center gap-4">
                <Button variant="ghost" className="self-start -ml-2" onClick={() => setShowSubscriptionPix(false)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Voltar aos meses
                </Button>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{selectedSubscriptionMonth.name} • vence em {getSubscriptionDueDate(selectedMonth).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="bg-white p-4 rounded-xl">
                  <img src={pixQrImage} alt="QR Code PIX" width={180} height={180} />
                </div>
                <PixCopyKey />
                <Button variant="outline" className="w-full" onClick={handleCopySubscriptionPix}>
                  <Copy className="h-4 w-4 mr-2" /> Copiar PIX e marcar como pago
                </Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground px-1">O vencimento mensal será sempre no dia {subscriptionStartDate?.getDate()}.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {subscriptionMonths
                    .filter((month) => !subscriptionStartDate || month.index >= subscriptionStartDate.getMonth())
                    .map((month) => {
                    const status = getMonthStatus(month.index);
                    const dueDate = getSubscriptionDueDate(month.index);
                    return (
                      <button
                        key={month.name}
                        onClick={() => handleOpenSubscriptionMonth(month.index)}
                        className={`text-left bg-card rounded-xl p-4 border transition-all ${selectedMonth === month.index ? "border-primary shadow-md" : "border-border"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-sm text-foreground">{month.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">Vencimento: {dueDate.toLocaleDateString("pt-BR")}</p>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-[11px] font-semibold whitespace-nowrap ${status.className}`}>
                            {status.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : (
        <>
        {/* Progress */}
        {pixStats && (
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Meta do mês</span>
            <span className="font-semibold text-foreground">R$ {Number(pixStats.current_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / R$ {Number(pixStats.month_goal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full gradient-primary rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, Math.round((pixStats.current_amount / pixStats.month_goal) * 100))}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{pixStats.donor_count} doadores {pixStats.month_label} 💚</p>
        </div>
        )}

        {!showPix ? (
          <>
            {/* Options */}
            <h2 className="font-display text-lg font-semibold text-foreground mb-3">Escolha o valor</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {donationOptions.map((opt) => (
                <DonationCard
                  key={opt.amount}
                  {...opt}
                  selected={selectedAmount === opt.amount}
                  onSelect={() => {
                    setSelectedAmount(opt.amount);
                    setCustomAmount("");
                  }}
                />
              ))}
            </div>

            {/* Custom amount */}
            <div className="bg-card rounded-xl p-4 border border-border mb-6">
              <label className="text-sm font-medium text-foreground mb-2 block">Outro valor</label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-medium">R$</span>
                <input
                  type="number"
                  placeholder="0,00"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                  className="flex-1 bg-muted rounded-lg px-3 py-2.5 text-foreground text-lg font-semibold placeholder:text-muted-foreground/50 border-0 outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* CTA */}
            <Button
              className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base rounded-xl shadow-lg hover:opacity-90 transition-opacity"
              onClick={handleDonate}
            >
              <QrCode className="h-5 w-5 mr-2" />
              Doar com PIX
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              🔒 Pagamento seguro via PIX
            </p>
          </>
        ) : (
          <div className="space-y-5 animate-fade-in-up">
            {/* Amount display */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Valor da doação</p>
              <p className="font-display text-3xl font-bold text-primary">
                R$ {finalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-card rounded-2xl p-6 border border-border flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-xl">
                <img src={pixQrImage} alt="QR Code PIX" width={200} height={200} />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Escaneie o QR Code com o app do seu banco
              </p>
              <PixCopyKey />
            </div>

            {/* Copy button */}
            <Button variant="outline" className="w-full h-12" onClick={handleCopyPix}>
              {copied ? <Check className="h-5 w-5 mr-2" /> : <Copy className="h-5 w-5 mr-2" />}
              {copied ? "Código copiado!" : "Copiar código PIX"}
            </Button>

            {/* Back */}
            <Button variant="ghost" className="w-full" onClick={handleReset}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Alterar valor
            </Button>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default Donations;
