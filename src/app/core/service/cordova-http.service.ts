import { Injectable, NgZone } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';
import { HttpService } from './http.service';

@Injectable({ providedIn: 'root' })
export class CordovaHttpService extends HttpService {
  constructor(private http: HTTP, private zone: NgZone) {
    super();
  }

  get(url: string, params: any): Promise<any> {
    console.log('[HTTP] GET', url, params);
    return new Promise((resolve, reject) => {
      this.http
        .get(url, params, null)
        .then((response) => {
          console.log('[HTTP] Response', response);
          this.zone.run(() => {
            if (response.status === 200) {
              return resolve(JSON.parse(response.data));
            } else {
              reject(response);
            }
          });
        })
        .catch((err) => {
          this.zone.run(() => {
            reject(err);
          });
        });
    });
  }
  post(url: string, body: any): Promise<any> {
    if (body instanceof FormData) {
      this.http.setDataSerializer('multipart');
    } else {
      this.http.setDataSerializer('json');
    }
    console.log('[HTTP] POST', url, body);
    return new Promise((resolve, reject) => {
      this.http
        .post(url, body, null)
        .then((response) => {
          console.log('[HTTP] Response', response);
          this.zone.run(() => {
            if (response.status === 200) {
              return resolve(JSON.parse(response.data));
            } else {
              reject(response);
            }
          });
        })
        .catch((err) => {
          this.zone.run(() => {
            reject(err);
          });
        });
    });
  }
}
