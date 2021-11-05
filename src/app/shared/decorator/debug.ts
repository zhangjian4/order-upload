/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { environment } from 'src/environments/environment';

export function Log() {
  return function(target: any, methodName: string, desc: any) {
    if (!environment.production) {
      const original = desc.value;
      desc.value = function(...args: any[]) {
        const start = new Date().getTime();
        const result = original.apply(this, args);
        const useTime = new Date().getTime() - start;
        console.log(`[Log]execute ${methodName} use ${useTime}ms`);
        return result;
      };
    }
  };
}
