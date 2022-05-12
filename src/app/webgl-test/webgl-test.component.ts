import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

const VSHADER_SOURCE = `
attribute vec4 a_Position;
attribute vec2 uv;
varying vec2 vUv;
void main(){
  // 进行插值计算
  vUv = uv;
  gl_Position = a_Position;
}
`;

const FSHADER_SOURCE = `
// 片元着色器中一定要声明精度
precision mediump float;
varying vec2 vUv;
uniform sampler2D u_Texture;

// 求平均
vec4 calculate(vec4 color, vec2 vUv){
  vec4 tempColor = color;
  if(vUv.x != 0.0 && vUv.y != 0.0){
    vec4 left = texture2D(u_Texture, floor(vUv * 200.0 + vec2(-1.0, 0.0)) / 200.0);
    vec4 right = texture2D(u_Texture, floor(vUv * 200.0 + vec2(1.0, 0.0)) / 200.0);
    vec4 top = texture2D(u_Texture, floor(vUv * 200.0 + vec2(0.0, 1.0)) / 200.0);
    vec4 bottom = texture2D(u_Texture, floor(vUv * 200.0 + vec2(0.0, -1.0)) / 200.0);
    // tempColor.rg = 1.0 * (left.rg + right.rg + top.rg + tempColor.rg + bottom.rg) / 5.0;
    tempColor = 1.0 * (left + right + top + tempColor + bottom) / 5.0;
  }

  return tempColor;
}

void main(){
  vec4 color = texture2D(u_Texture, vUv);

  color = calculate(color, vUv);

  gl_FragColor = color;
}
`;

@Component({
  selector: 'app-webgl-test',
  templateUrl: './webgl-test.component.html',
  styleUrls: ['./webgl-test.component.scss'],
})
export class WebglTestComponent implements OnInit {
  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('image', { static: true })
  image: ElementRef<HTMLImageElement>;
  gl: WebGLRenderingContext;
  programe: WebGLProgram;
  vertexShaderSource: string;
  fragmentShaderSource: string;

  vertexs = new Float32Array([
    -1, 1, 0.0, 0.0, 1.0, -1, -1, 0.0, 0.0, 0.0, 1, 1, 0.0, 1.0, 1.0, 1, -1,
    0.0, 1.0, 0.0,
  ]);
  program: WebGLProgram;

  constructor() {}
  ngOnInit(): void {
    const canvas = this.canvas.nativeElement;
    this.gl = canvas.getContext('webgl');
    this.vertexShaderSource = `
    attribute vec4 a_Position;
    attribute vec2 a_TexCoord;
    varying vec2 v_TexCoord;
    void main(){
        gl_Position = a_Position;
        v_TexCoord = a_TexCoord;
    }`;
    this.fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_Sampler;
    varying vec2 v_TexCoord;
    void main(){
    	gl_FragColor = texture2D(u_Sampler, v_TexCoord);
    }`;

    let vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER); // 创建顶点着色器
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

    let vertexsBuffer = this.gl.createBuffer();

    if (vertexsBuffer === null) {
      console.log('vertexsBuffer is null');
      return;
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexsBuffer);

    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexs, this.gl.STATIC_DRAW);

    let a_Position = this.gl.getAttribLocation(program, 'a_Position');
    if (a_Position < 0) {
      console.log('a_Position < 0');
      return;
    }

    let a_TexCoord = this.gl.getAttribLocation(program, 'a_TexCoord');
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

  onLoad(event) {
    let textureId = this.gl.createTexture(); //创建纹理对象

    if (textureId === null) {
      console.log('textureId is null');
      return false;
    }

    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1); // 对纹理图像进行y轴反转
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
      this.image.nativeElement
    ); // 配置纹理图像

    let u_Sampler = this.gl.getUniformLocation(this.program, 'u_Sampler');
    if (u_Sampler < 0) {
      console.log('u_Sampler < 0');
      return false;
    }
    this.gl.uniform1i(u_Sampler, 0); // 将0号纹理传递给着色器
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }
}
