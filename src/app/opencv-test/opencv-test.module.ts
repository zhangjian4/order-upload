import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpencvTestComponent } from './opencv-test.component';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [OpencvTestComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: OpencvTestComponent,
      }
    ]),
  ]
})
export class OpencvTestModule { }
