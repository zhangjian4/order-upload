import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaiduAPIService } from '../core/service/baidu-api.service';

@Component({
  selector: 'app-oauth',
  templateUrl: './oauth.component.html',
  styleUrls: ['./oauth.component.scss'],
})
export class OauthComponent implements OnInit {
  code: string;
  constructor(
    route: ActivatedRoute,
    private baiduAPIService: BaiduAPIService,
    private router: Router
  ) {
    route.queryParams.subscribe((params) => {
      this.code = params.code;
      console.log('code:', this.code);
      this.getToken(this.code);
    });
  }

  ngOnInit() {}

  async getToken(code: string) {
    await this.baiduAPIService.getToken(code);
    this.router.navigateByUrl('/', { replaceUrl: true });
  }
}
