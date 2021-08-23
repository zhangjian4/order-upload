import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';

@Injectable({providedIn:'root'})
export class StartupService {
  constructor(private platform: Platform, private storage: Storage) {}
  async load() {
    await this.platform.ready();
    await this.storage.create();
  }
}
