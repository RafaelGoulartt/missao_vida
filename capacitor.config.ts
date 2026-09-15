import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.missaovida.app',
  appName: 'Missão Vida',
  webDir: 'dist',
  android: {
    // O app é servido de http://localhost dentro da WebView.
    // Necessário para que o Supabase (sessão, cookies) funcione sem avisos de origem insegura.
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
