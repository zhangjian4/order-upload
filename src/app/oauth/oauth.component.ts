import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-oauth',
  templateUrl: './oauth.component.html',
  styleUrls: ['./oauth.component.scss'],
})
export class OauthComponent implements OnInit {

  type:string;
  code:string;
  constructor(route: ActivatedRoute) {
    route.params.subscribe((params)=>{
      this.type=params.type;
      console.log('type:',this.type)
    })
    route.queryParams.subscribe(params => {
      this.code=params.code;
      console.log('code:',this.code);
    })
  }

  ngOnInit() { }

  getToken(code: string) {
    console.log(code);
  }
}
