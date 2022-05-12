/* eslint-disable @typescript-eslint/naming-convention */
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.orderupload',
  appName: 'pjgl',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    iosScheme: 'ionic',
    allowNavigation: ['baidu.com', 'openapi.baidu.com', 'zhangj1992.gitee.io'],
  },
  cordova: {
    preferences: {
      ScrollEnabled: 'false',
      BackupWebStorage: 'none',
      SplashMaintainAspectRatio: 'true',
      FadeSplashScreenDuration: '300',
      SplashShowOnlyFirstTime: 'false',
      SplashScreen: 'screen',
      SplashScreenDelay: '3000',
    },
  },
};

export default config;
