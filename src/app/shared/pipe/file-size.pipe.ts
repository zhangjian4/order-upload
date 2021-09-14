import { Pipe, PipeTransform } from '@angular/core';
import { formatFileSize } from '../util/unit.util';

@Pipe({
  name: 'fileSize',
})
export class FileSizePipe implements PipeTransform {
  units = ['Byte', 'KB', 'MB', 'GB', 'TB'];

  transform(value: number): string {
    return formatFileSize(value);
  }
}
