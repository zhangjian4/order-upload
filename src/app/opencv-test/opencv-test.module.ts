import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpencvTestComponent } from './opencv-test.component';
import { RouterModule } from '@angular/router';
import { BlobSrcModule } from '../shared/directive/blob-src/blob-src.module';

@NgModule({
  declarations: [OpencvTestComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: OpencvTestComponent,
      },
    ]),
    BlobSrcModule,
  ],
})
export class OpencvTestModule {}
