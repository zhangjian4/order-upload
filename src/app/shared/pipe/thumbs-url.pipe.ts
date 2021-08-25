import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'thumbsUrl',
})
export class ThumbsUrlPipe implements PipeTransform {
  transform(value: string): string {
    console.log(value);
    if (value) {
      value = value.replace(/&dp-logid=\d+/, '');
    }
    return value;
  }
}
