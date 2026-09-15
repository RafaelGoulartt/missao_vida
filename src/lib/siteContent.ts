// Schema/defaults of all editable content. Each section becomes a tab in the admin CMS.
import heroBanner from "@/assets/hero-banner.png";
import campanhaAgasalho from "@/assets/campanha-agasalho.jpeg";
import pixQrCodeAsset from "@/assets/pix-qrcode.jpeg.asset.json";

export type ContentField =
  | { key: string; label: string; type: "text" | "textarea" | "image" | "video" | "url"; placeholder?: string };

export type ContentSection = {
  key: string;
  label: string;
  description?: string;
  fields: ContentField[];
};

export const contentSections: ContentSection[] = [
  {
    key: "home_hero",
    label: "Home — Banner principal",
    fields: [
      { key: "eyebrow", label: "Pequeno texto acima", type: "text" },
      { key: "title", label: "Título principal", type: "textarea" },
      { key: "image", label: "Imagem de fundo (URL)", type: "image" },
    ],
  },
  {
    key: "home_documentary",
    label: "Home — Documentário",
    fields: [
      { key: "section_title", label: "Título da seção", type: "text" },
      { key: "video_url", label: "URL do vídeo (YouTube embed ou link)", type: "video" },
      { key: "description", label: "Descrição abaixo do vídeo", type: "textarea" },
    ],
  },
  {
    key: "home_stats",
    label: "Home — Estatísticas",
    fields: [
      { key: "stat1_label", label: "Estatística 1 — rótulo", type: "text" },
      { key: "stat1_value", label: "Estatística 1 — valor", type: "text" },
      { key: "stat2_label", label: "Estatística 2 — rótulo", type: "text" },
      { key: "stat2_value", label: "Estatística 2 — valor", type: "text" },
      { key: "stat3_label", label: "Estatística 3 — rótulo", type: "text" },
      { key: "stat3_value", label: "Estatística 3 — valor", type: "text" },
    ],
  },
  {
    key: "home_actions_header",
    label: "Home — Cabeçalho das ações",
    fields: [
      { key: "title", label: "Título", type: "text" },
      { key: "link_label", label: "Texto do link", type: "text" },
    ],
  },
  {
    key: "donations_header",
    label: "Doações — Cabeçalho",
    fields: [
      { key: "title", label: "Título", type: "text" },
      { key: "subtitle", label: "Subtítulo", type: "text" },
    ],
  },
  {
    key: "donations_subscription_intro",
    label: "Doações — Guardiões",
    fields: [
      { key: "title", label: "Título", type: "text" },
      { key: "description", label: "Descrição", type: "textarea" },
      { key: "video_url", label: "URL do vídeo explicativo", type: "video" },
      { key: "video_placeholder", label: "Texto enquanto não há vídeo", type: "text" },
    ],
  },
  {
    key: "pix_qrcode",
    label: "PIX — QR Code",
    description: "Imagem e chave usadas em TODOS os PIX de doação (doações, Guardiões, voluntários e ações).",
    fields: [
      { key: "image", label: "Imagem do QR Code PIX", type: "image" },
      { key: "pix_key", label: "PIX copia e cola (chave ou código)", type: "textarea", placeholder: "Chave PIX ou código copia e cola" },
    ],
  },
  {
    key: "help_contact",
    label: "Ajuda — Contato",
    fields: [
      { key: "phone", label: "Telefone", type: "text" },
      { key: "phone_link", label: "Link do telefone (tel:)", type: "url" },
      { key: "email", label: "E-mail", type: "text" },
      { key: "address", label: "Endereço", type: "textarea" },
    ],
  },
];

// Defaults used as fallback when DB has no value yet.
export const contentDefaults: Record<string, Record<string, string>> = {
  home_hero: {
    eyebrow: "Fevereiro 2026",
    title: "Transformando vidas, juntos.",
    image: heroBanner,
  },
  home_documentary: {
    section_title: "MISSÃO VIDA!",
    video_url: "https://www.youtube.com/embed/szI05tMKKVk",
    description: "Conheça a história e o impacto do nosso trabalho nas comunidades.",
  },
  home_stats: {
    stat1_label: "Famílias ajudadas",
    stat1_value: "1.240",
    stat2_label: "Voluntários ativos",
    stat2_value: "328",
    stat3_label: "Ações este mês",
    stat3_value: "12",
  },
  home_actions_header: {
    title: "Ações do Mês",
    link_label: "Ver todas",
  },
  donations_header: {
    title: "Doe Agora",
    subtitle: "Cada gesto faz a diferença",
  },
  donations_subscription_intro: {
    title: "Guardiões",
    description: "Uma contribuição mensal livre para manter as ações da ONG acontecendo com previsibilidade.",
    video_url: "",
    video_placeholder: "Vídeo explicativo em breve",
  },
  pix_qrcode: {
    image: pixQrCodeAsset.url,
    pix_key: "",
  },
  help_contact: {
    phone: "(11) 94128-9195",
    phone_link: "tel:+5511941289195",
    email: "missaovida@missaovida.org.br",
    address: "R. Jaci, 314 - Cidade Ariston Estela Azevedo, Carapicuíba - SP, 06396-190",
  },
};

// Convert YouTube watch/shortlinks to embed URLs.
export const toEmbedUrl = (url: string) => {
  if (!url) return "";
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
};

export { heroBanner, campanhaAgasalho };
