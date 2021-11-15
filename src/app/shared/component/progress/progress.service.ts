import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ProgressComponent } from './progress.component';

@Injectable()
export class ProgressService {
  constructor(private modalController: ModalController) {}

  async create(message?: string) {
    const value$: Subject<number> = new BehaviorSubject<number>(0);
    const modal = await this.modalController.create({
      component: ProgressComponent,
      componentProps: { message, value$ },
      animated: false,
    });
    modal.style.setProperty('--background', 'initial');
    await modal.present();
    return value$;
  }
}
