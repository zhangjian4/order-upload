import { Injectable } from "@angular/core";
import { HTTP } from "@ionic-native/http/ngx";
import { HttpService } from "./http.service";

@Injectable({ providedIn: 'root' })
export class CordovaHttpService extends HttpService {

    constructor(private http: HTTP) {
        super();
    }

    get(url: string, params: any): Promise<any> {
        throw new Error("Method not implemented.");
    }
    post(url: string, body: any): Promise<any> {
        throw new Error("Method not implemented.");
    }
}