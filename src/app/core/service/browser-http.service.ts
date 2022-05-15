import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BrowserHttpService extends HttpService {
  constructor(private http: HttpClient) {
    super();
  }

  getUrl(url: string) {
    return url
      .replace('https://openapi.baidu.com', '')
      .replace('https://pan.baidu.com', '')
      .replace('https://d.pcs.baidu.com', '');
  }

  get(url: string, params: any): Promise<any> {
    url = this.getUrl(url);
    return firstValueFrom(this.http.get(url, { params }));
  }
  post(url: string, body: any): Promise<any> {
    url = this.getUrl(url);
    return firstValueFrom(this.http.post(url, body));
  }
}
