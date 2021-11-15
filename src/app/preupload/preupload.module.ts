import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PreuploadComponent } from './preupload.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { BlobSrcModule } from '../shared/directive/blob-src/blob-src.module';
import { SharedModule } from '../shared/shared.module';
import { EditComponent } from './edit/edit.component';
import { SwiperModule } from 'swiper/angular';
import { DirSelectComponent } from './dir-select/dir-select.component';
import { ImageDataModule } from '../shared/directive/image-data/image-data.module';
import { ProgressModule } from '../shared/component/progress/progress.module';

@NgModule({
  declarations: [PreuploadComponent, EditComponent, DirSelectComponent],
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
    ImageDataModule,
    ProgressModule,
  ],
  providers: [],
})
export class PreuploadModule {}
