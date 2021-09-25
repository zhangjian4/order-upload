import { Injectable, NgZone } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';
import { Platform, ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { HttpService } from './http.service';
import * as SparkMD5 from 'spark-md5';
import { Subject } from 'rxjs';
const ErrorMessage = {
  0: '成功',
  '-1': '用户名和密码验证失败',
  '-2': '备用',
  '-3': '用户未激活（调用init接口）',
  '-4': 'COOKIE中未找到host_key&user_key（或BDUSS）',
  '-5': 'host_key和user_key无效',
  '-6': '身份验证失败',
  '-7': '文件或目录名错误或无权访问',
  '-8': '该目录下已存在此文件',
  '-9': '文件被所有者删除，操作失败',
  '-10': '你的空间不足了',
  '-11': '父目录不存在',
  '-12': '设备尚未注册',
  '-13': '设备已经被绑定',
  '-14': '帐号已经初始化',
  '-21': '预置文件无法进行相关操作',
  '-22': '被分享的文件无法重命名，移动等操作',
  '-23': '数据库操作失败，请联系netdisk管理员',
  '-24': '要取消的文件列表中含有不允许取消public的文件。',
  '-25': '非公测用户',
  '-26': '邀请码失效',
  1: '服务器错误 ',
  2: '参数错误',
  3: '一次操作文件不可超过100个',
  4: '新文件名错误',
  5: '目标目录非法',
  6: '备用',
  7: 'NS非法或无权访问',
  8: 'ID非法或无权访问',
  9: '申请key失败',
  10: '创建文件的superfile失败',
  11: 'user_id(或user_name)非法或不存在',
  12: '部分文件已存在于目标文件夹中',
  13: '此目录无法共享',
  14: '系统错误',
  103: '提取码错误',
  104: '验证cookie无效',
  201: '系统错误',
  202: '系统错误',
  203: '系统错误',
  204: '系统错误',
  205: '系统错误',
  301: '其他请求出错',
  501: '获取的LIST格式非法',
  618: '请求curl返回失败',
  619: 'pcs返回错误码',
  600: 'json解析出错',
  601: 'exception抛出异常',
  617: 'getFilelist其他错误',
  211: '无权操作或被封禁',
  404: '秒传md5不匹配 rapidupload 错误码',
  406: '秒传创建文件失败 rapidupload 错误码',
  407: 'fileModify接口返回错误，未返回requestid rapidupload 错误码',
  31080: '服务器出错',
  31021: '网络连接失败，请检查网络或稍候再试',
  31034: '操作过于频繁，请稍后再试',
  31075: '一次支持操作999个',
  31116: '你的空间不足',
  42000: '访问过于频繁',
  42001: 'rand校验失败',
  112: '页面已过期，请刷新后重试',
  111: '当前还有任务未完成,请等待当前任务结束后再进行操作',
  '-32': '你的空间不足',
};

@Injectable({ providedIn: 'root' })
export class BaiduAPIService {
  appId = '24729357';
  appKey = 'GwSU34r2Ni23OEObLFU637VipOlhzh5r';
  secretKey = 'U6z8Z3FOLQnFyYANZMdtPgxcfNHwLMhj';
  defaultDir = '/票据上传';
  fileChange = new Subject();

  constructor(
    private http: HttpService,
    private platform: Platform,
    private zone: NgZone,
    private storage: Storage,
    public toastController: ToastController
  ) {}

  get redirectUri() {
    return location.origin + '/oauth';
  }

  async logout() {
    await this.storage.remove('access_token');
    await this.storage.remove('refresh_token');
    this.oauth();
  }

  oauth() {
    const redirectUri = encodeURIComponent(this.redirectUri);
    const url = `https://openapi.baidu.com/oauth/2.0/authorize?response_type=code&client_id=${this.appKey}&redirect_uri=${redirectUri}&scope=basic,netdisk&display=mobile&force_login=1`;
    location.href = url;
  }

  getUserInfo() {
    return this.get('https://pan.baidu.com/rest/2.0/xpan/nas', {
      method: 'uinfo',
    });
  }

  search(dir: string, key: string, page: number, num: number) {
    return this.get('https://pan.baidu.com/rest/2.0/xpan/file', {
      method: 'search',
      key,
      dir,
      recursion: '1',
      page: page.toString(),
      num: num.toString(),
      web: '1',
    });
  }

  async getFileList(dir: string, start: number, limit: number, folder = '0') {
    try {
      return await this.get(
        'https://pan.baidu.com/rest/2.0/xpan/file',
        {
          method: 'list',
          dir,
          web: '1',
          order: 'time',
          desc: '1',
          start: start + '',
          limit: limit + '',
          folder,
        },
        true,
        false
      );
    } catch (e) {
      if (e.errno === -9) {
        await this.post(
          'https://pan.baidu.com/rest/2.0/xpan/file?method=create',
          { path: this.defaultDir, size: 0, isdir: 1 }
        );
        return await this.get('https://pan.baidu.com/rest/2.0/xpan/file', {
          method: 'list',
          dir: this.defaultDir,
          order: 'time',
          desc: '1',
          start: start + '',
          limit: limit + '',
        });
      } else {
        this.showError(e.errno);
        throw e;
      }
    }
  }

  async post(url: string, body: any) {
    await this.platform.ready();
    const token = await this.getAccessToken();
    if (url.includes('?')) {
      url = url + '&access_token=' + token;
    } else {
      url = url + '?access_token=' + token;
    }
    const response = await this.http.post(url, body);
    return this.handleResponse(response);
  }

  async get(url: string, params?: any, withToken = true, showError = true) {
    await this.platform.ready();
    if (params == null) {
      params = {};
    }
    if (withToken) {
      params.access_token = await this.getAccessToken();
    }
    try {
      const response = await this.http.get(url, params);
      return this.handleResponse(response, showError);
    } catch (e) {
      this.handleError(e);
    }
  }

  handleError(e: any) {
    console.error(e);
    throw e;
  }

  handleResponse(response: any, showError = true) {
    if (response.errno != null && response.errno !== 0) {
      if (response.errno === -6) {
        this.oauth();
      } else {
        this.showError(response.errno);
      }
      throw response;
    }
    return response;
  }

  async showError(errno: number) {
    let error = ErrorMessage[errno.toString()];
    if (error == null) {
      error = '错误码:' + errno;
    }
    if (error) {
      const toast = await this.toastController.create({
        message: error,
        position: 'top',
        duration: 2000,
      });
      toast.present();
    }
  }

  async getToken(code: string) {
    const data = await this.get(
      'https://openapi.baidu.com/oauth/2.0/token',
      {
        grant_type: 'authorization_code',
        code,
        client_id: this.appKey,
        client_secret: this.secretKey,
        redirect_uri: this.redirectUri,
      },
      false
    );
    await this.storage.set('refresh_token', data.refresh_token);
    await this.storage.set('access_token', data.access_token);
    // await this.platform.ready();
    // const response = await this.http.get(
    //   'https://openapi.baidu.com/oauth/2.0/token',
    //   {
    //     grant_type: 'authorization_code',
    //     code,
    //     client_id: this.appKey,
    //     client_secret: this.secretKey,
    //     redirect_uri: this.redirectUri,
    //   },
    //   null
    // );
    // console.log(response);
    // const redirectUri = encodeURIComponent(
    //   'http://www.example.com/oauth/token'
    // );
    // const url = `https://openapi.baidu.com/oauth/2.0/token?grant_type=authorization_code&code=${code}&client_id=${this.appKey}&client_secret=${this.secretKey}&redirect_uri=${redirectUri}`;
    // location.href = url;
  }

  async upload(dir: string, fileName: string, file: Blob) {
    // const path = encodeURIComponent(this.defaultDir + '/' + fileName);
    if (!dir.endsWith('/')) {
      dir += '/';
    }
    const path = dir + fileName;
    const size = file.size;
    const spark = new SparkMD5.ArrayBuffer();
    spark.append(file);
    const md5 = spark.end();
    const blockList = [md5];
    const result = await this.precreate(path, size, blockList);
    const uploadid = result.uploadid;
    const result2 = await this.superfile(path, uploadid, file);
    const blockList2 = [result2.md5];
    const result3 = await this.create(path, size, '0', uploadid, blockList2);
    this.fileChange.next();
  }

  precreate(path: string, size: number, blockList: string[]) {
    const form = new FormData();
    form.append('path', path);
    form.append('size', size.toString());
    form.append('isdir', '0');
    form.append('autoinit', '1');
    form.append('block_list', JSON.stringify(blockList));
    return this.post(
      'https://pan.baidu.com/rest/2.0/xpan/file?method=precreate',
      form
    );
  }

  superfile(path: string, uploadid: string, file: Blob) {
    path = encodeURIComponent('path');
    const form = new FormData();
    form.append('file', file);
    return this.post(
      `https://d.pcs.baidu.com/rest/2.0/pcs/superfile2?method=upload&type=tmpfile&path=${path}&uploadid=${uploadid}&partseq=0`,
      form
    );
  }
  // await this.post(
  //   'https://pan.baidu.com/rest/2.0/xpan/file?method=create',
  //   { path: this.defaultDir, size: 0, isdir: 1 }
  // );
  create(
    path: string,
    size: number,
    isdir: string,
    uploadid?: string,
    blockList?: string[]
  ) {
    const form = new FormData();
    form.append('path', path);
    form.append('size', size.toString());
    form.append('isdir', isdir);
    if (isdir === '0') {
      form.append('uploadid', uploadid);
      form.append('block_list', JSON.stringify(blockList));
    }
    return this.post(
      'https://pan.baidu.com/rest/2.0/xpan/file?method=create',
      form
    );
  }

  async getAccessToken() {
    const token = await this.storage.get('access_token');
    if (token == null) {
      this.oauth();
      throw '登录过期，请重新登录';
    } else {
      return token;
    }
  }

  multimedia(fsids: number[]) {
    return this.get('https://pan.baidu.com/rest/2.0/xpan/multimedia', {
      method: 'filemetas',
      fsids: JSON.stringify(fsids),
      dlink: '1',
      extra: '1',
    });
  }

  async getDlink(dlink: string) {
    const token = await this.getAccessToken();
    return dlink + '&access_token=' + token;
  }

  // private resolve<T>(result: T): Promise<T> {
  //   return new Promise((resolve) => {
  //     this.zone.run(() => resolve(result));
  //   });
  // }
}
