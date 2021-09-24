import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'thumbsUrl',
})
export class ThumbsUrlPipe implements PipeTransform {
  transform(item: any, size?: string): string {
    let value = this.getIcon('other_v2');
    if (item) {
      if (item.thumbs) {
        value = item.thumbs.url1;
        const url = new URL(value);
        url.searchParams.delete('dp-logid');
        if (size) {
          url.searchParams.set('size', size);
        }
        value = url.toString();
      } else if (item.isdir) {
        value = this.getIcon('file2');
      } else {
        const fileName: string = item.server_filename;
        const index = fileName.lastIndexOf('.');
        if (index !== -1) {
          const ext = fileName.substr(index + 1);
          switch (ext) {
            case 'rar':
            case 'zip':
              value = this.getIcon('compress_v2');
              break;
            case 'exe':
              value = this.getIcon('exe_v2');
              break;
            case 'txt':
              value = this.getIcon('txt_v2');
              break;
            case 'doc':
            case 'docx':
              value = this.getIcon('word_v2');
              break;
          }
        }
      }
    }
    return value;
  }

  getIcon(type: string) {
    return `/assets/img/ic_${type}.png`;
  }
}
