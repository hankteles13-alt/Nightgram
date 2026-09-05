import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nightgram.app',
  appName: 'Nightgram',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
