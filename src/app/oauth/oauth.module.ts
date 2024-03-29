import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OauthComponent } from './oauth.component';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [OauthComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: OauthComponent,
      }
    ]),
  ]
})
export class OauthModule { }
