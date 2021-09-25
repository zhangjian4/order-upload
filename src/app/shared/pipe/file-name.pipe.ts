import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileName',
})
export class FileNamePipe implements PipeTransform {
  transform(value: string): unknown {
    if (value != null) {
      if (value === '/') {
        value = '我的文件';
      } else {
        return value.substr(value.lastIndexOf('/') + 1);
      }
    }
    return value;
  }
}
