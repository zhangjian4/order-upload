import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PreuploadComponent } from './preupload.component';
import { DbImageModule } from '../shared/directive/db-image/db-image.module';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [PreuploadComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: PreuploadComponent,
      },
    ]),
    DbImageModule,
    IonicModule,
    FormsModule
  ],
})
export class PreuploadModule {}
