import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { StatusBar } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

@Injectable({ providedIn: 'root' })
export class StartupService {
  constructor(
    private platform: Platform,
    private storage: Storage,
  ) {}
  async load() {
    await this.platform.ready();
    await this.storage.create();
    if (this.platform.is('cordova')) {
      if (this.platform.is('android')) {
        document.body.style.setProperty('--ion-safe-area-top', '31px');
        document.body.style.setProperty('--ion-safe-area-bottom', '20px');
      }
      StatusBar.show();
      // 沉浸式并且悬浮透明
      // StatusBar.styleDefault(); // 黑色字体
      StatusBar.setOverlaysWebView({ overlay: true });
      SplashScreen.hide();
    }
  }
}
