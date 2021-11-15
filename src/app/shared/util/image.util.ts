import { Log } from "../decorator/debug";

export const imageToCanvas = (image: HTMLImageElement, scale = 1) => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width * scale;
  canvas.height = image.height * scale;
  const ctx = canvas.getContext('2d');
  if (scale !== 1) {
    ctx.scale(scale, scale);
  }
  ctx.drawImage(image, 0, 0, image.width, image.height);
  return canvas;
};

export const imageToBlob = (image: HTMLImageElement) => {
  const canvas = imageToCanvas(image);
  return canvasToBlob(canvas);
};

export const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.src = url;
    image.onload = () => {
      resolve(image);
    };
    image.onerror = (e) => {
      reject(e);
    };
  });

export const imageToImageData = (image: HTMLImageElement) => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, image.width, image.height);
  return ctx.getImageData(0, 0, image.width, image.height);
};

export const urlToBlob = async (url: string) => {
  const image = await loadImage(url);
  return imageToBlob(image);
};

export const base64ToArrayBuffer = (base64: string) => {
  const binStr = atob(base64);
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  return arr;
};

export const canvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      'image/jpeg',
      1
    );
  });

export const base64ToBlob = (base64: string) => {
  const buffer = base64ToArrayBuffer(base64);
  const blob = new Blob([buffer], {
    type: 'image/jpeg',
  });
  return blob;
};

export const base64ToImageData = async (base64: string) => {
  const image = await loadImage('data:image/jpeg;base64,' + base64);
  const imageData = imageToImageData(image);
  return imageData;
};

export const imageDataToBlob = async (imageData: ImageData) => {
  // const start = new Date().getTime();
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  ctx.putImageData(imageData, 0, 0);
  const blob = await canvasToBlob(canvas);
  // const end = new Date().getTime();
  // console.log('imageDataToBlob use ' + (end - start) + 'ms');
  return blob;
};

export const blobToImageData = async (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  try {
    const image = await loadImage(url);
    const imageData = imageToImageData(image);
    return imageData;
  } finally {
    URL.revokeObjectURL(url);
  }
};
