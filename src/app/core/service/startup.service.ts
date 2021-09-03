import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';

@Injectable({ providedIn: 'root' })
export class StartupService {
  constructor(
    private platform: Platform,
    private storage: Storage,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen
  ) {}
  async load() {
    await this.platform.ready();
    await this.storage.create();
    if(this.platform.is('cordova')){
      if(this.platform.is('android')){
        document.body.style.setProperty('--ion-safe-area-top', '31px');
      }
      this.statusBar.show();
      // 沉浸式并且悬浮透明
      this.statusBar.styleDefault(); // 黑色字体
      this.statusBar.overlaysWebView(true);
      this.splashScreen.hide();
    }
  }
}
