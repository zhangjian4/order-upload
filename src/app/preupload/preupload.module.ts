import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PreuploadComponent } from './preupload.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { BlobSrcModule } from '../shared/directive/blob-src/blob-src.module';
import { SharedModule } from '../shared/shared.module';
import { EditComponent } from './edit/edit.component';
import { PreuploadService } from './preupload.service';
import { SwiperModule } from 'swiper/angular';

@NgModule({
  declarations: [PreuploadComponent, EditComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: PreuploadComponent,
      },
      {
        path: 'edit',
        component: EditComponent,
      },
    ]),
    BlobSrcModule,
    IonicModule,
    FormsModule,
    SharedModule,
    SwiperModule,
  ],
  providers:[
    PreuploadService
  ]
})
export class PreuploadModule {}
