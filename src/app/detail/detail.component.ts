import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaiduAPIService } from '../core/service/baidu-api.service';
import { FileService } from '../core/service/file.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
})
export class DetailComponent implements OnInit {
  id: number;
  index: number;
  image: string;

  constructor(
    private route: ActivatedRoute,
    private fileService: FileService,
    private baiduAPIService: BaiduAPIService
  ) {
    route.queryParams.subscribe((params) => {
      this.id = +params.id;
      this.index = +params.index;
      this.reload();
    });
  }

  ngOnInit() {}

  async reload() {
    const result = await this.baiduAPIService.multimedia([this.id]);
    this.image = await this.baiduAPIService.getDlink(result.list[0].dlink);
    console.log(result);
  }
}
