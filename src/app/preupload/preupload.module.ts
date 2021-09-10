import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PreuploadComponent } from './preupload.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { BlobSrcModule } from '../shared/directive/blob-src/blob-src.module';

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
    BlobSrcModule,
    IonicModule,
    FormsModule,
  ],
})
export class PreuploadModule {}
