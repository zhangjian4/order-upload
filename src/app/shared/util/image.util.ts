export const imageToBlob = (image: HTMLImageElement) => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, image.width, image.height);
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
  return createImageBitmap(image);
  // const canvas = document.createElement('canvas');
  // canvas.width = image.width;
  // canvas.height = image.height;
  // const ctx = canvas.getContext('2d');
  // ctx.drawImage(image, 0, 0, image.width, image.height);
  // return ctx.getImageData(0, 0, image.width, image.height);
};

export const urlToBlob = async (url: string) => {
  const image = await loadImage(url);
  return imageToBlob(image);
};

export const base64ToArrayBuffer = (base64: string) => {
  const binStr = atob(base64);
  let len = binStr.length;
  const arr = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  return arr;
};

export const canvasToBlob = (canvas: HTMLCanvasElement) => {
  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      'image/jpeg',
      1
    );
  });
};
export const base64ToBlob = (base64: string) => {
  const buffer = base64ToArrayBuffer(base64);
  const blob = new Blob([buffer], {
    type: 'image/jpeg',
  });
  return blob;
};
