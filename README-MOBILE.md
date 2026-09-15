# Missão Vida — App Mobile (Capacitor)

O app mobile **é o mesmo site React/Vite**, empacotado dentro de uma WebView nativa pelo
[Capacitor](https://capacitorjs.com). Não existe código duplicado: o que está em `src/` é o
que roda no celular.

| Item | Valor |
| --- | --- |
| App name | `Missão Vida` |
| App ID (bundle id) | `com.missaovida.app` |
| Pasta de build web | `dist/` |
| Config | [capacitor.config.ts](capacitor.config.ts) |
| Projeto Android | [android/](android/) |
| Projeto iOS | [ios/](ios/) |

---

## Fluxo de trabalho no dia a dia

```bash
# 1. desenvolver normalmente, no navegador
npm run dev

# 2. quando quiser ver/atualizar no celular
npm run build:mobile      # = vite build && cap sync
npm run open:android      # abre o Android Studio
```

`cap sync` faz duas coisas: copia `dist/` para dentro dos projetos nativos **e** atualiza os
plugins nativos instalados via npm. Rode sempre que mudar o código web ou instalar um plugin.

> **Importante:** o conteúdo web é copiado, não linkado. Mudou algo em `src/`?
> Sem `npm run build:mobile` o celular continua mostrando a versão antiga.

---

## Rodando no Android

**Pré-requisitos:** [Android Studio](https://developer.android.com/studio) (traz o SDK e o
emulador) e um JDK 21 — você já tem o JDK 21 instalado nesta máquina.

```bash
npm run build:mobile
npm run open:android        # ou: npx cap open android
```

No Android Studio:

1. Espere o Gradle sincronizar na primeira abertura (baixa bastante coisa, pode demorar).
2. Escolha um dispositivo no seletor do topo — um emulador (Device Manager → Create Device)
   ou seu celular via USB com **Depuração USB** ligada nas Opções do desenvolvedor.
3. Clique em ▶ **Run**.

Para gerar o instalador:

- **APK de teste** (manda por WhatsApp, instala direto): Build → Build Bundle(s)/APK(s) →
  Build APK(s). Sai em `android/app/build/outputs/apk/debug/`.
- **AAB para a Play Store**: Build → Generate Signed Bundle / APK. Exige criar uma
  **keystore** — guarde o arquivo `.jks` e a senha em lugar seguro: perdeu, perdeu a
  capacidade de atualizar o app publicado. (A keystore está no `.gitignore`; **não** commite.)

### Depurar o app Android

Com o app rodando, abra no Chrome do PC: `chrome://inspect` → o dispositivo aparece na lista →
**inspect**. Você ganha o DevTools completo (console, network, elementos) apontando para dentro
da WebView. É a forma mais rápida de descobrir por que uma tela quebrou no celular.

---

## Rodando no iOS

**Pré-requisitos:** um **Mac** com [Xcode](https://developer.apple.com/xcode/) instalado.
Não há como compilar iOS no Windows — nem com máquina virtual, legalmente. As opções são:
Mac emprestado/da faculdade, um serviço de CI com runner macOS (GitHub Actions, Codemagic,
Ionic Appflow), ou deixar o iOS para depois.

A pasta `ios/` já está criada e versionada, então no Mac basta clonar o repo e:

```bash
npm install
npm run build:mobile
npm run open:ios            # ou: npx cap open ios
```

No Xcode: selecione o simulador ou o iPhone conectado e clique em ▶.

Para rodar em um iPhone físico ou publicar, é preciso uma
**Apple Developer Account** (US$ 99/ano) e configurar *Signing & Capabilities* com o seu Team.
Com conta gratuita dá para instalar no próprio aparelho, mas o app expira em 7 dias.

### Depurar o app iOS

Safari no Mac → menu **Desenvolvedor** → nome do dispositivo → a WebView do app.

---

## Adicionando plugins nativos

Plugins dão acesso a APIs que o navegador não tem (câmera, push, biometria...). O padrão é
sempre o mesmo:

```bash
npm install @capacitor/camera
npx cap sync                 # <- imprescindível: registra o plugin no código nativo
```

E no código React:

```ts
import { Camera, CameraResultType } from '@capacitor/camera';

const foto = await Camera.getPhoto({
  quality: 80,
  resultType: CameraResultType.Uri,
});
// foto.webPath serve direto num <img src=...>
```

Plugins que fazem sentido para este app:

| Plugin | Para quê | Observação |
| --- | --- | --- |
| `@capacitor/app` | Botão "voltar" do Android, deep links | **Recomendo instalar já** — veja a seção de atenção abaixo |
| `@capacitor/browser` | Abrir links externos (Google Maps, links de pagamento) | Substitui `window.open` |
| `@capacitor/geolocation` | GPS na tela do Mapa | Pede permissão nativa corretamente |
| `@capacitor/camera` | Foto de perfil, comprovante de doação | Requer texto de justificativa no `Info.plist` |
| `@capacitor/push-notifications` | Avisos de novas ações/eventos | Exige Firebase (Android) e APNs + conta paga (iOS) |
| `@capacitor/share` | Compartilhar uma ação no WhatsApp | Usa a folha de compartilhamento nativa |
| `@capacitor/preferences` | Substituto nativo do `localStorage` | Mais confiável que `localStorage` no iOS |
| `@capacitor/splash-screen` | Controlar a tela de abertura nativa | Complementa o `SplashScreen.tsx` atual |

Cada plugin que pede permissão exige declaração nativa:

- **Android** → `android/app/src/main/AndroidManifest.xml` (tags `<uses-permission>`)
- **iOS** → `ios/App/App/Info.plist` (chaves `NS...UsageDescription`, com texto em português
  explicando o uso — a Apple rejeita textos genéricos na revisão)

---

## Ícone e splash screen

Instale a ferramenta oficial e coloque as artes em `resources/`:

```bash
npm install -D @capacitor/assets
# resources/icon.png          -> 1024x1024, sem cantos arredondados, sem transparência
# resources/splash.png        -> 2732x2732, logo centralizado no miolo (as bordas são cortadas)
# resources/splash-dark.png   -> opcional
npx capacitor-assets generate
```

Isso gera automaticamente todos os tamanhos para Android e iOS.

---

## Estrutura no Git

As pastas `android/` e `ios/` **são versionadas** (elas trazem os próprios `.gitignore` para os
artefatos de build). Isso mantém no repositório as configurações nativas que você editar
manualmente — permissões, ícones, signing.

Se algum dia elas ficarem inconsistentes, dá para recriá-las do zero:

```bash
rm -rf android ios
npx cap add android && npx cap add ios && npx cap sync
```

⚠️ Isso **apaga qualquer edição manual** feita nos arquivos nativos.

---

## Pontos de atenção nesta base de código

Levantamento do que pode se comportar diferente dentro da WebView.

### 🔴 1. Variáveis de ambiente do Supabase (bloqueante)

[src/integrations/supabase/client.ts](src/integrations/supabase/client.ts) lê
`VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. **Não existe arquivo `.env` nesta
máquina** (ele foi removido do versionamento no commit `bfdbc8f`), então o bundle atual em
`dist/` foi compilado com esses valores `undefined` — o app abre e falha em tudo que toca o
banco.

Diferente da web, aqui **o valor é congelado dentro do APK** no momento do build: não há
variável de ambiente do servidor para corrigir depois. Antes de gerar qualquer build para
celular, crie o `.env` na raiz e rode `npm run build:mobile` de novo:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

(A chave `publishable`/`anon` é pública por definição — a proteção real é o RLS no Supabase.
Ainda assim, confira se as policies de RLS estão ativas, porque um APK é trivialmente
descompilável.)

### 🔴 2. Login: `emailRedirectTo` e OAuth do Google

[src/pages/Auth.tsx:37](src/pages/Auth.tsx#L37) e
[src/pages/Auth.tsx:150](src/pages/Auth.tsx#L150) usam `window.location.origin` como destino
do redirect. Dentro do app isso vale `http://localhost` (Android) ou `capacitor://localhost`
(iOS) — endereços que só existem dentro daquele aparelho. Consequência:

- **Confirmação de e-mail:** o link que chega no Gmail aponta para `http://localhost` e não
  abre o app.
- **Login com Google:** o fluxo OAuth sai para o navegador e não consegue voltar.

Correções possíveis, da mais simples à mais correta:

1. **Mais simples:** apontar o redirect para o site publicado
   (`https://deed-finder-app.lovable.app`). O usuário confirma o e-mail no navegador e depois
   volta ao app e faz login com senha. Funciona, mas é um fluxo feio.
2. **Correto:** configurar **deep link** — registrar o esquema `com.missaovida.app://` (o
   Capacitor já criou a string `custom_url_scheme` no Android) ou um App Link `https://`,
   adicionar essa URL em *Authentication → URL Configuration → Redirect URLs* no painel do
   Supabase, e capturar o retorno com o plugin `@capacitor/app`:

   ```ts
   import { App } from '@capacitor/app';
   App.addListener('appUrlOpen', ({ url }) => {
     // extrair o token da url e chamar supabase.auth.setSession / exchangeCodeForSession
   });
   ```
3. Para Google especificamente, o caminho recomendado é o
   [@capacitor-community/google-auth](https://github.com/CapacitorCommunity/google-auth), que
   usa a tela de login nativa e devolve um `idToken` para
   `supabase.auth.signInWithIdToken()`.

### 🟡 3. Armazenamento da sessão (`localStorage`)

[src/integrations/supabase/previewAuthStorage.ts](src/integrations/supabase/previewAuthStorage.ts)
detecta se está num preview do Lovable dentro de um iframe; no celular nada disso se aplica e
ele cai no `localStorage` puro (linha 18) — que é o comportamento desejado.

O risco é outro: **o `localStorage` do iOS não é armazenamento durável.** O WKWebView pode
limpá-lo quando o sistema precisa de espaço, e o usuário é deslogado sem motivo aparente. Se
isso aparecer em testes, troque por `@capacitor/preferences`, que grava em armazenamento
nativo:

```ts
import { Preferences } from '@capacitor/preferences';

const capacitorStorage = {
  getItem: async (key: string) => (await Preferences.get({ key })).value,
  setItem: (key: string, value: string) => Preferences.set({ key, value }),
  removeItem: (key: string) => Preferences.remove({ key }),
};
```

Isso se encaixa direto no campo `auth.storage` do `createClient`.

As preferências de [src/pages/Settings.tsx:12-29](src/pages/Settings.tsx#L12-L29) (`app-volume`,
`app-font-size`, `app-dark-mode`) têm o mesmo risco, mas perder essas é inofensivo.

### 🟡 4. Botão físico "voltar" do Android

O `BrowserRouter` de [src/App.tsx:299](src/App.tsx#L299) funciona na WebView (o app é servido
de `http://localhost/`, então rotas de caminho funcionam sem `HashRouter`). Porém, **o botão
voltar do Android não navega o histórico por padrão** — ele fecha o app. Usuários odeiam isso.

Instale `@capacitor/app` e trate o evento:

```ts
import { App as CapApp } from '@capacitor/app';
// dentro de um componente sob o Router:
CapApp.addListener('backButton', ({ canGoBack }) => {
  if (canGoBack) window.history.back();
  else CapApp.exitApp();
});
```

O `vercel.json` com rewrite para `index.html` não é usado no mobile — o Capacitor já serve
`index.html` para qualquer rota desconhecida.

### 🟡 5. Links externos com `window.open` / `target="_blank"`

Na WebView, `window.open(..., '_blank')` costuma abrir uma janela sem barra de endereço, sem
botão de voltar e sem sessão — o usuário fica preso. Afeta:

- [SponsorshipSection.tsx:56,69](src/components/SponsorshipSection.tsx#L56) — **links de
  pagamento de apadrinhamento**. Este é o mais crítico: é dinheiro entrando.
- [MapPlaceholder.tsx:89](src/components/MapPlaceholder.tsx#L89) — rota no Google Maps
- [Donations.tsx:305](src/pages/Donations.tsx#L305), [Index.tsx:138](src/pages/Index.tsx#L138),
  [NewsAdmin.tsx:200](src/components/NewsAdmin.tsx#L200),
  [SponsorshipAdmin.tsx:165](src/components/SponsorshipAdmin.tsx#L165)

Solução — `@capacitor/browser`, que abre o navegador do sistema (Chrome Custom Tab / Safari
View Controller), com barra de endereço e botão de fechar:

```ts
import { Browser } from '@capacitor/browser';
await Browser.open({ url: child.payment_link });
```

Vale criar um helper único (`openExternal(url)`) que usa `Browser.open` quando
`Capacitor.isNativePlatform()` e `window.open` no navegador.

### 🟡 6. Geolocalização precisa de permissão nativa

[MapPlaceholder.tsx:24](src/components/MapPlaceholder.tsx#L24) chama
`navigator.geolocation.getCurrentPosition` **automaticamente no `useEffect`**. O
`AndroidManifest.xml` gerado só declara `INTERNET`, então a chamada falha silenciosamente e a
tela mostra "Não foi possível obter sua localização."

Adicione em `android/app/src/main/AndroidManifest.xml`, junto das outras permissões:

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

E em `ios/App/App/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Usamos sua localização para traçar a rota até a sede da Missão Vida.</string>
```

Mesmo assim, no Android 6+ a permissão precisa ser **pedida em tempo de execução** — a API web
não faz isso de forma confiável na WebView. Use `@capacitor/geolocation`, que trata o pedido
corretamente. E considere pedir a localização só quando o usuário tocar no botão, em vez de na
abertura da tela: um pop-up de permissão logo de cara aumenta muito a taxa de recusa.

### 🟡 7. `<iframe>` do Google Maps

[MapPlaceholder.tsx:60](src/components/MapPlaceholder.tsx#L60) embute o Maps via iframe com uma
**chave de API exposta no código-fonte**. Dois problemas no mobile:

- Iframes de terceiros na WebView podem ser bloqueados ou renderizar mal (gestos de
  pan/zoom competindo com o scroll da página).
- A chave `AIzaSy...` fica no bundle. Restrinja essa chave no Google Cloud Console por
  *application restriction* e por API, senão qualquer um pode usá-la na sua cota.

Alternativa mais nativa: substituir o iframe por um botão que abre o app do Google Maps
instalado, via `@capacitor/browser` ou um link `geo:` / `comgooglemaps://`.

### 🟢 8. `navigator.clipboard` (chaves PIX)

Usado em [Donations.tsx:131,239](src/pages/Donations.tsx#L131),
[PixCopyKey.tsx:21](src/components/PixCopyKey.tsx#L21),
[Participate.tsx:88](src/pages/Participate.tsx#L88) e
[Volunteer.tsx:128](src/pages/Volunteer.tsx#L128).

Deve funcionar: `http://localhost` e `capacitor://localhost` contam como *secure context*, e
todas as chamadas partem de um clique. Ainda assim, **teste o "copiar chave PIX" nos dois
sistemas** — é o caminho da doação, e se falhar o usuário desiste. Se der problema, o plugin
`@capacitor/clipboard` resolve.

### 🟢 9. Cookie do componente de sidebar

[src/components/ui/sidebar.tsx:68](src/components/ui/sidebar.tsx#L68) grava `document.cookie`.
Cookies funcionam na WebView, e isso guarda só o estado aberto/fechado da sidebar. Sem impacto.

### ⚠️ 10. Fora do escopo mobile, mas achei no caminho

[src/App.tsx](src/App.tsx) tem **marcadores de conflito de merge não resolvidos**: um
`=======` solto na [linha 169](src/App.tsx#L169) e o hash
`d64a7cebd793ee34fc1f7dd5e8cb4f6c6fd6c0ee` na [linha 278](src/App.tsx#L278), com o bloco
inteiro de rotas duplicado entre eles. O React Router ignora filhos que não são elementos, e
rotas duplicadas resolvem pela primeira ocorrência, então o app ainda funciona — mas é um bug
esperando para acontecer, e a rota `/eventos` existe **apenas** no bloco duplicado. Vale
limpar antes de empacotar.

---

## Referências

- [Capacitor — Documentação](https://capacitorjs.com/docs)
- [Lista oficial de plugins](https://capacitorjs.com/docs/plugins)
- [Supabase Auth com deep links no Capacitor](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)
- [Publicar na Play Store](https://capacitorjs.com/docs/android/deploying-to-google-play)
- [Publicar na App Store](https://capacitorjs.com/docs/ios/deploying-to-app-store)
