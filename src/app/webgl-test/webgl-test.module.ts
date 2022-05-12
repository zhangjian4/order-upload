import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WebglTestComponent } from './webgl-test.component';



@NgModule({
  declarations: [WebglTestComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: WebglTestComponent,
      },
    ]),
  ]
})
export class WebglTestModule { }
