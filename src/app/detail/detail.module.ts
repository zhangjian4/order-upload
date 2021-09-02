import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { DetailComponent } from './detail.component';
import { SwiperModule } from 'swiper/angular';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [DetailComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: DetailComponent,
      },
    ]),
    SharedModule,
    IonicModule,
    SwiperModule,
  ],
})
export class DetailModule {}
