import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { firstValueFrom } from 'rxjs';
// import { HTTP } from '@awesome-cordova-plugins/http/ngx';
import { environment } from 'src/environments/environment';
import { HttpService } from './http.service';
import {
  Http,
  HttpHeaders,
  HttpOptions,
  HttpResponse,
  HttpUploadFileOptions,
} from '@capacitor-community/http';
import writeFile from 'capacitor-blob-writer';
import { Directory } from '@capacitor/filesystem';

@Injectable({ providedIn: 'root' })
export class CordovaHttpService extends HttpService {
  private directory = Directory.Cache;
  constructor(private zone: NgZone, private http: HttpClient) {
    super();
  }
  async get(url: string, params: any): Promise<any> {
    const options: HttpOptions = {
      url,
      params,
      responseType: 'json',
    };
    const response = await Http.get(options);
    return response.data;
  }
  async post(url: string, data: any): Promise<any> {
    const headers: HttpHeaders = {};
    let filePath: string;
    let name: string;
    if (data instanceof FormData) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      const json: any = {};
      for (const [key, value] of (data as any).entries()) {
        if (value != null) {
          if (value instanceof Blob) {
            name = key;
            filePath = 'upload/temp.jpg';
            const result = await writeFile({
              directory: this.directory,
              path: filePath,
              blob: value,
              recursive: true,
            });
            console.log(result);
          } else {
            json[key] = value.toString();
          }
        }
      }
      data = json;
    }
    let response: HttpResponse;
    if (filePath) {
      const options: HttpUploadFileOptions = {
        url,
        name,
        filePath,
        fileDirectory: this.directory,
        data,
        responseType: 'json',
      };
      response = await Http.uploadFile(options);
    } else {
      const options: HttpOptions = {
        url,
        data,
        headers,
        responseType: 'json',
      };
      response = await Http.post(options);
    }

    return response.data;
  }

  async uploadFile(url: string, name: string, filePath: string, data: any) {
    const options: HttpUploadFileOptions = {
      url,
      name,
      filePath,
      data,
    };
    const response = await Http.uploadFile(options);
    return response.data;
  }
  // get(url: string, params: any): Promise<any> {
  //   this.log('GET', url, params);
  //   return new Promise((resolve, reject) => {
  //     this.http
  //       .get(url, params, null)
  //       .then((response) => {
  //         this.log('Response', response);
  //         this.zone.run(() => {
  //           if (response.status === 200) {
  //             return resolve(JSON.parse(response.data));
  //           } else {
  //             reject(response);
  //           }
  //         });
  //       })
  //       .catch((err) => {
  //         this.zone.run(() => {
  //           reject(err);
  //         });
  //       });
  //   });
  // }
  // post(url: string, body: any): Promise<any> {
  //   if (body instanceof FormData) {
  //     this.http.setDataSerializer('multipart');
  //   } else {
  //     this.http.setDataSerializer('json');
  //   }
  //   this.log('POST', url, body);
  //   return new Promise((resolve, reject) => {
  //     this.http
  //       .post(url, body, null)
  //       .then((response) => {
  //         this.log('Response', response);
  //         this.zone.run(() => {
  //           if (response.status === 200) {
  //             return resolve(JSON.parse(response.data));
  //           } else {
  //             reject(response);
  //           }
  //         });
  //       })
  //       .catch((err) => {
  //         this.zone.run(() => {
  //           reject(err);
  //         });
  //       });
  //   });
  // }
  // log(type: string, ...data: any[]) {
  //   if (!environment.production) {
  //     console.log('[HTTP] ' + type, ...data);
  //   }
  // }
}
