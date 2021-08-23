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
export function StartupServiceFactory(startupService: StartupService) {
  return () => startupService.load();
}

export function HttpServiceFactory(platform: Platform, browserHttpService: BrowserHttpService, cordovaHttpService: CordovaHttpService) {
  if (platform.is('cordova')) {
    return cordovaHttpService;
  } else {
    return browserHttpService;
  }
}

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, IonicStorageModule.forRoot(), HttpClientModule],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    HTTP,
    {
      provide: APP_INITIALIZER,
      useFactory: StartupServiceFactory,
      deps: [StartupService],
      multi: true,
    },
    {
      provide: HttpService,
      useFactory: HttpServiceFactory,
      deps: [Platform, BrowserHttpService, CordovaHttpService],
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
