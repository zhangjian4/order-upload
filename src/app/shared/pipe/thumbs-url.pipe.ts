import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'thumbsUrl',
})
export class ThumbsUrlPipe implements PipeTransform {
  transform(value: string, size?: string): string {
    if (value) {
      const url=new URL(value);
      url.searchParams.delete('dp-logid');
      if(size){
        url.searchParams.set('size',size);
      }
      value = url.toString();
    }
    return value;
  }
}
