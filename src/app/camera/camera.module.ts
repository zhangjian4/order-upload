import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CameraComponent } from './camera.component';
import { CameraPreview} from '@ionic-native/camera-preview/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [CameraComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: CameraComponent,
      },
    ]),
    IonicModule
  ],
  providers: [CameraPreview,WebView],
})
export class CameraModule {}
