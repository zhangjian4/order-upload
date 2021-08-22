import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { BaiduAPIService } from '../core/service/baidu-api.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {

  constructor(private menu: MenuController,private baiduAPIService:BaiduAPIService) { }

  ngOnInit() {}
  openFirst() {
    this.baiduAPIService.oauth();
  }

  openEnd() {
    this.menu.open('end');
  }

  openCustom() {
    this.menu.enable(true, 'custom');
    this.menu.open('custom');
  }
}
