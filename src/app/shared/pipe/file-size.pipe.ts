import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileSize',
})
export class FileSizePipe implements PipeTransform {
  units = ['Byte', 'KB', 'MB', 'GB', 'TB'];

  transform(value: number): string {
    if (value) {
      for (const unit of this.units) {
        if (value < 1024) {
          return Number(value.toFixed(2)) + unit;
        } else {
          value = value / 1024;
        }
      }
    }
    return null;
  }
}
