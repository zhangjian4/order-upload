import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, Platform } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent{
  constructor(
    router: Router,
    platform: Platform,
    navController: NavController
  ) {
    (router as any).canceledNavigationResolution = 'computed';
    platform.backButton.subscribeWithPriority(1, () => {
      navController.pop();
    });
  }
}
