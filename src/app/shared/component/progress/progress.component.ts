import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss'],
})
export class ProgressComponent implements OnInit {
  @Input()
  message: string;
  value$: Observable<number>;
  value = 0;

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    if (this.value$) {
      this.value$.subscribe(
        (value) => {
          this.value = value;
        },
        (error) => {
          console.error(error);
        },
        () => {
          this.close();
        }
      );
    }
  }

  close() {
    this.modalController.dismiss({
      dismissed: true,
    });
  }
}
