import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CameraComponent } from './camera.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ConfirmGuard } from '../shared/router-guard/confirm.guard';
import { ImageDataModule } from '../shared/directive/image-data/image-data.module';
import { ProgressModule } from '../shared/component/progress/progress.module';
// import { CameraPreview } from '@awesome-cordova-plugins/camera-preview/ngx';

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
      {
        path: ':id',
        component: CameraComponent,
        canDeactivate: [ConfirmGuard],
      },
    ]),
    IonicModule,
    FormsModule,
    ImageDataModule,
    ProgressModule
  ],
  providers: [ConfirmGuard],
})
export class CameraModule {}
