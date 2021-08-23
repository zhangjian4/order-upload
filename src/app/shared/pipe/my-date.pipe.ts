import { Pipe, PipeTransform } from '@angular/core';
import { format } from 'date-fns';

@Pipe({
  name: 'myDate',
})
export class MyDatePipe implements PipeTransform {
  transform(value: number): string {
    if (value) {
      const date = new Date(value * 1000);
      return format(date, 'yyyy-MM-dd HH:mm:ss');
    }
    return null;
  }
}
