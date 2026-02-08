import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.routines365.app',
  appName: 'Routines365',
  webDir: 'out',
  server: {
    url: 'https://routines365.com/app/today',
    cleartext: false,
  },
  ios: {
    scheme: 'Routines365',
    contentInset: 'always',
    preferredContentMode: 'mobile',
    backgroundColor: '#000000',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: '#000000',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
    },
  },
};

export default config;
