import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { HttpClient } from '@angular/common/http';

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
    return this.http.get(url, { params }).toPromise();
  }
  post(url: string, body: any): Promise<any> {
    url = this.getUrl(url);
    return this.http.post(url, body).toPromise();
  }
}
