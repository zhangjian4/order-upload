import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HTTP } from '@ionic-native/http/ngx';

import { IonicModule, IonicRouteStrategy, Platform } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { IonicStorageModule } from '@ionic/storage-angular';
import { StartupService } from './core/service/startup.service';
import { HttpService } from './core/service/http.service';
import { BrowserHttpService } from './core/service/browser-http.service';
import { HttpClientModule } from '@angular/common/http';
import { CordovaHttpService } from './core/service/cordova-http.service';
import { CodePush } from '@ionic-native/code-push/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';

const startupServiceFactory = (startupService: StartupService) => () =>
  startupService.load();

const httpServiceFactory = (
  platform: Platform,
  browserHttpService: BrowserHttpService,
  cordovaHttpService: CordovaHttpService
) => {
  if (platform.is('cordova')) {
    return cordovaHttpService;
  } else {
    return browserHttpService;
  }
};

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    IonicStorageModule.forRoot(),
    HttpClientModule,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    HTTP,
    CodePush,
    StatusBar,
    SplashScreen,
    {
      provide: APP_INITIALIZER,
      useFactory: startupServiceFactory,
      deps: [StartupService],
      multi: true,
    },
    {
      provide: HttpService,
      useFactory: httpServiceFactory,
      deps: [Platform, BrowserHttpService, CordovaHttpService],
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
