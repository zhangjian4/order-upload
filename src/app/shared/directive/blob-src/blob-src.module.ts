import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlobSrcDirective } from './blob-src.directive';



@NgModule({
  declarations: [
    BlobSrcDirective
  ],
  imports: [
    CommonModule
  ],
  exports:[
    BlobSrcDirective
  ]
})
export class BlobSrcModule { }
