import { Pipe, PipeTransform } from '@angular/core';
import {
  DomSanitizer,
  SafeHtml,
  SafeStyle,
  SafeUrl,
  SafeResourceUrl,
} from '@angular/platform-browser';
type DomSanitizerType = 'html' | 'style' | 'url' | 'resourceUrl';
@Pipe({
  name: 'sanitizer',
})
export class SanitizerPipe implements PipeTransform {
  constructor(protected sanitizer: DomSanitizer) {}
  transform(value: string, type: 'html'): SafeHtml;
  transform(value: string, type: 'style'): SafeStyle;
  transform(value: string, type: 'url'): SafeUrl;
  transform(value: string, type: 'resourceUrl'): SafeResourceUrl;
  transform(
    value: string,
    type: DomSanitizerType = 'html'
  ): SafeHtml | SafeStyle | SafeUrl | SafeResourceUrl {
    switch (type) {
      case 'html':
        return this.sanitizer.bypassSecurityTrustHtml(value);
      case 'style':
        return this.sanitizer.bypassSecurityTrustStyle(value);
      case 'url':
        return this.sanitizer.bypassSecurityTrustUrl(value);
      case 'resourceUrl':
        return this.sanitizer.bypassSecurityTrustResourceUrl(value);
      default:
        throw new Error(`Invalid safe type specified`);
    }
  }
}
