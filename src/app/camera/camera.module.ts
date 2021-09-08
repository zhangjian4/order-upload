import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CameraComponent } from './camera.component';
import { CameraPreview } from '@ionic-native/camera-preview/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { DbImageModule } from '../shared/directive/db-image/db-image.module';
import { ConfirmGuard } from '../shared/router-guard/confirm.guard';

@NgModule({
  declarations: [CameraComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: CameraComponent,
        canDeactivate: [ConfirmGuard],
      },
    ]),
    IonicModule,
    FormsModule,
    DbImageModule,
  ],
  providers: [CameraPreview, WebView,ConfirmGuard],
})
export class CameraModule {}
