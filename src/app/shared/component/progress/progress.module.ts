import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressService } from './progress.service';
import { ProgressComponent } from './progress.component';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [ProgressComponent],
  imports: [CommonModule, IonicModule],
  providers: [ProgressService],
})
export class ProgressModule {}
