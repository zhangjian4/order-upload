import { Component, OnInit } from '@angular/core';
import { Database } from '../core/service/database.service';

@Component({
  selector: 'app-preupload',
  templateUrl: './preupload.component.html',
  styleUrls: ['./preupload.component.scss'],
})
export class PreuploadComponent implements OnInit {
  data: any[];
  renameId: number;
  editName:string;

  constructor(private database: Database) {}

  ngOnInit() {
    this.reload();
  }

  async reload() {
    this.data = await this.database.preuploadFile.toArray();
  }

  rename(item: any) {
    this.renameId = item.id;
    this.editName=item.name;
  }
}
