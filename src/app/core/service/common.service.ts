import { Injectable } from '@angular/core';
import {
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class CommonService {
  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  async toast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'middle',
      color: 'dark',
    });
    toast.present();
  }

  async alert(message: string) {
    const alert = await this.alertController.create({
      message,
      backdropDismiss: false,
      buttons: [
        {
          text: '确定',
        },
      ],
    });
    await alert.present();
  }

  async confirm(message: string) {
    return new Promise<boolean>(async (resolve) => {
      const alert = await this.alertController.create({
        message,
        backdropDismiss: false,
        buttons: [
          {
            text: '取消',
            role: 'cancel',
            handler: () => {
              resolve(false);
            },
          },
          {
            text: '确定',
            handler: () => {
              resolve(true);
            },
          },
        ],
      });
      await alert.present();
    });
  }

  async loading(message: string, method: () => void | Promise<void>) {
    const loading = await this.loadingController.create({ message });
    loading.present();
    try {
      await method();
    } finally {
      loading.dismiss();
    }
  }
}
