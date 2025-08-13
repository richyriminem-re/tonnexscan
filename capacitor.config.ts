import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.55c13801eced483f88c8c13f0f706a95',
  appName: 'tonnex-scan-parse-56',
  webDir: 'dist',
  server: {
    url: 'https://55c13801-eced-483f-88c8-c13f0f706a95.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Preferences: {
      secure: true
    }
  }
};

export default config;