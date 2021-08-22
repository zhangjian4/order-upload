import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class BaiduAPIService {
    appId = '24729357';
    appKey = 'mgTiuNldCNxeKhCxHboO5LrXXq7sElye'
    secretKey = 'mgTiuNldCNxeKhCxHboO5LrXXq7sElye'

    oauth() {
        const redirectUri = encodeURIComponent('http://www.example.com/oauth');
        // const url = `https://openapi.baidu.com/oauth/2.0/authorize?response_type=token&client_id=${this.appKey}&redirect_uri=${redirectUri}&scope=basic,netdisk&display=popup&state=xxx`;
        const url = `https://openapi.baidu.com/oauth/2.0/authorize?response_type=code&client_id=${this.appKey}&redirect_uri=${redirectUri}&scope=basic,netdisk&display=popup`;
        location.href = url;
    }

    getToken(code: string) {
        const redirectUri = encodeURIComponent('http://www.example.com/oauth/token');
        const url = `https://openapi.baidu.com/oauth/2.0/token?grant_type=authorization_code&code=${code}&client_id=${this.appKey}&client_secret=${this.secretKey}&redirect_uri=${redirectUri}`;
        location.href = url;
    }
}