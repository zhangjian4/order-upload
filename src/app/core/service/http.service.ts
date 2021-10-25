export abstract class HttpService {
  abstract get(url: string, params: any): Promise<any>;

  abstract post(url: string, body: any): Promise<any>;
}
