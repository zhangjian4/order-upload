/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/naming-convention */
import { Injectable } from '@angular/core';
import { firstValueFrom, fromEvent, map, Observable, take } from 'rxjs';
import { Log } from 'src/app/shared/decorator/debug';

@Injectable({ providedIn: 'root' })
export class WebGLService {
  vertexShaderSource = `
    attribute vec4 a_Position;
    attribute vec2 a_TexCoord;
    varying vec2 v_TexCoord;
    void main(){
        gl_Position = a_Position;
        v_TexCoord = a_TexCoord;
    }`;
  fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_Sampler;
    varying vec2 v_TexCoord;
    void main(){
    	gl_FragColor = texture2D(u_Sampler, v_TexCoord);
    }`;
  vertexs = new Float32Array([
    -1, 1, 0.0, 0.0, 1.0, -1, -1, 0.0, 0.0, 0.0, 1, 1, 0.0, 1.0, 1.0, 1, -1,
    0.0, 1.0, 0.0,
  ]);
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  image: HTMLImageElement;
  imageLoad$: Observable<Event>;
  ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.image = document.createElement('img');
    this.imageLoad$ = fromEvent(this.image, 'load');
    this.canvas.width = 600;
    this.canvas.height = 800;
    this.ctx = this.canvas.getContext('2d');
    // this.initWegGL();
  }

  initWegGL() {
    this.gl = this.canvas.getContext('webgl');
    const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER); // 创建顶点着色器
    this.gl.shaderSource(vertexShader, this.vertexShaderSource); // 绑定顶点着色器源码
    this.gl.compileShader(vertexShader); // 编译定点着色器

    const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER); // 创建片元着色器
    this.gl.shaderSource(fragmentShader, this.fragmentShaderSource); // 绑定片元着色器源码
    this.gl.compileShader(fragmentShader); // 编译片元着色器

    const shaderProgram = this.gl.createProgram(); // 创建着色器程序
    this.gl.attachShader(shaderProgram, vertexShader); // 指定顶点着色器
    this.gl.attachShader(shaderProgram, fragmentShader); // 指定片元着色色器

    this.gl.linkProgram(shaderProgram); // 链接程序
    this.gl.useProgram(shaderProgram); //使用着色器
    const program = shaderProgram;
    this.program = program;

    const vertexsBuffer = this.gl.createBuffer();

    if (vertexsBuffer === null) {
      console.log('vertexsBuffer is null');
      return;
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexsBuffer);

    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexs, this.gl.STATIC_DRAW);

    const a_Position = this.gl.getAttribLocation(program, 'a_Position');
    if (a_Position < 0) {
      console.log('a_Position < 0');
      return;
    }

    const a_TexCoord = this.gl.getAttribLocation(program, 'a_TexCoord');
    if (a_TexCoord < 0) {
      console.log('a_TexCoord < 0');
      return;
    }

    //将顶点坐标的位置赋值
    this.gl.vertexAttribPointer(
      a_Position,
      3,
      this.gl.FLOAT,
      false,
      this.vertexs.BYTES_PER_ELEMENT * 5,
      0
    );
    this.gl.enableVertexAttribArray(a_Position);

    //将纹理坐标赋值
    this.gl.vertexAttribPointer(
      a_TexCoord,
      2,
      this.gl.FLOAT,
      false,
      this.vertexs.BYTES_PER_ELEMENT * 5,
      this.vertexs.BYTES_PER_ELEMENT * 3
    );
    this.gl.enableVertexAttribArray(a_TexCoord);
  }

  onLoad() {
    const textureId = this.gl.createTexture(); //创建纹理对象
    if (textureId === null) {
      console.log('textureId is null');
      return false;
    }
    this.gl.activeTexture(this.gl.TEXTURE0); // 开启0号纹理单元
    this.gl.bindTexture(this.gl.TEXTURE_2D, textureId); // 向target绑定纹理对象
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE
    ); // 配置纹理参数
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.NEAREST
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.NEAREST
    );

    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      this.image
    ); // 配置纹理图像

    const u_Sampler = this.gl.getUniformLocation(this.program, 'u_Sampler');
    if (u_Sampler < 0) {
      console.log('u_Sampler < 0');
      return false;
    }
    this.gl.uniform1i(u_Sampler, 0); // 将0号纹理传递给着色器
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  @Log()
  async loadImage(src: string) {
    this.image.src = src;
    await firstValueFrom(this.imageLoad$);
    const { width, height } = this.canvas;
    /************* WegGL加载 **************************/
    // this.onLoad();
    // const pixels = new Uint8ClampedArray(width * height * 4);
    // this.gl.readPixels(
    //   0,
    //   0,
    //   width,
    //   height,
    //   this.gl.RGBA,
    //   this.gl.UNSIGNED_BYTE,
    //   pixels
    // );
    // const imageData = new ImageData(pixels, width, height, {});
    /************************************************/
    /*********************** Canvase2D 加载 ********************/
    const { naturalWidth: sw, naturalHeight: sh } = this.image;
    this.ctx.drawImage(this.image, 0, 0, sw, sh, 0, 0, width, height);
    const imageData = this.ctx.getImageData(0, 0, width, height);
    /***************************************************/
    return imageData;
  }
}
