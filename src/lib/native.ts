import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/integrations/supabase/client";

export const isNative = Capacitor.isNativePlatform();

// Deep link registrado no AndroidManifest.xml e no Info.plist.
// Precisa estar em Supabase > Authentication > URL Configuration > Redirect URLs.
const NATIVE_AUTH_REDIRECT = "com.missaovida.app://auth-callback";

// Para onde o Supabase manda o usuário depois do login com Google / confirmação de e-mail.
export const getAuthRedirectUrl = () =>
  isNative ? NATIVE_AUTH_REDIRECT : window.location.origin;

// Abre links externos no navegador do sistema (Custom Tab / Safari View Controller)
// em vez de dentro da WebView do app.
export const openExternal = async (url: string) => {
  if (isNative) {
    await Browser.open({ url });
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

export const signInWithGoogle = async () => {
  if (!isNative) {
    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getAuthRedirectUrl() },
    });
  }

  // No app, o Google não permite login dentro da WebView: abrimos no navegador do
  // sistema e o retorno chega pelo deep link, tratado em handleAuthDeepLink.
  const result = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: NATIVE_AUTH_REDIRECT, skipBrowserRedirect: true },
  });
  if (result.data?.url) await Browser.open({ url: result.data.url });
  return result;
};

// Recebe com.missaovida.app://auth-callback#access_token=...&refresh_token=...
// (ou ?code=... no fluxo PKCE) e cria a sessão no app.
let lastHandledUrl: string | null = null;

const handleAuthDeepLink = async (url: string) => {
  if (!url.startsWith(NATIVE_AUTH_REDIRECT) || url === lastHandledUrl) return;
  lastHandledUrl = url;

  const parsed = new URL(url);
  const params = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  parsed.searchParams.forEach((value, key) => params.set(key, value));

  try {
    await Browser.close();
  } catch {
    // o navegador já pode ter sido fechado pelo sistema
  }

  const code = params.get("code");
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (accessToken && refreshToken) {
    await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  }
};

const isExternalHttpLink = (href: string) => {
  try {
    const target = new URL(href, window.location.href);
    return /^https?:$/.test(target.protocol) && target.origin !== window.location.origin;
  } catch {
    return false;
  }
};

// Registra os comportamentos nativos. Retorna a função de limpeza.
export const setupNativeHandlers = (goBack: () => void) => {
  if (!isNative) return () => {};

  const backListener = CapApp.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) goBack();
    else CapApp.exitApp();
  });

  const urlListener = CapApp.addListener("appUrlOpen", ({ url }) => {
    handleAuthDeepLink(url);
  });

  // App aberto do zero pelo link (ex.: confirmação de e-mail com o app fechado).
  CapApp.getLaunchUrl().then((launch) => {
    if (launch?.url) handleAuthDeepLink(launch.url);
  });

  // Qualquer <a href="https://..."> externo abre no navegador do sistema.
  const onClick = (event: MouseEvent) => {
    const anchor = (event.target as HTMLElement | null)?.closest?.("a");
    const href = anchor?.getAttribute("href");
    if (!href || !isExternalHttpLink(href)) return;
    event.preventDefault();
    openExternal(new URL(href, window.location.href).toString());
  };
  document.addEventListener("click", onClick, true);

  return () => {
    backListener.then((l) => l.remove());
    urlListener.then((l) => l.remove());
    document.removeEventListener("click", onClick, true);
  };
};
