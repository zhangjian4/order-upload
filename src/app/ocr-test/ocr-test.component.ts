import { Component, OnInit } from '@angular/core';
// import { createWorker } from 'tesseract.js';

@Component({
  selector: 'app-ocr-test',
  templateUrl: './ocr-test.component.html',
  styleUrls: ['./ocr-test.component.scss'],
})
export class OcrTestComponent implements OnInit {
  title = 'tesseract.js-angular-app';
  ocrResult = 'Recognizing...';
  image = '/assets/img/test5.jpg';
  constructor() {}
  ngOnInit(): void {
    this.doOCR();
  }
  async doOCR() {
    // const worker = createWorker({
    //   workerPath: '/assets/tesseract/worker.min.js',
    //   langPath: '/assets/tesseract/lang-data',
    //   corePath: '/assets/tesseract/tesseract-core.wasm.js',
    //   logger: (m) => console.log(m),
    //   errorHandler: (e) => console.error(e),
    // });
    // await worker.load();
    // await worker.loadLanguage('eng');
    // await worker.initialize('eng');
    // await worker.setParameters({'min_characters_to_try': 7} as any);
    // // await worker.setParameters({ user_defined_dpi: 7 } as any);
    // const { data } = await worker.recognize(this.image);
    // // this.ocrResult = text;
    // console.log(data);
    // await worker.terminate();
  }
}
