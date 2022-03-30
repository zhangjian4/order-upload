let canvasInstance: HTMLCanvasElement = null;

const getCanvas = () => {
  if (canvasInstance == null) {
    canvasInstance = document.createElement('canvas');
  }
  return canvasInstance;
};

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

export const imageToBlob = (image: HTMLImageElement, scale = 1) => {
  const canvas = imageToCanvas(image, scale);
  return canvasToBlob(canvas);
};

export const imageToBase64 = (image: HTMLImageElement, scale = 1) => {
  const canvas = imageToCanvas(image, scale);
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

export const imageToImageData = (image: HTMLImageElement, scale = 1) => {
  const canvas = getCanvas();
  canvas.width = image.width * scale;
  canvas.height = image.height * scale;
  const ctx = canvas.getContext('2d');
  if (scale !== 1) {
    ctx.scale(scale, scale);
  }
  ctx.drawImage(image, 0, 0, image.width, image.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return imageData;
};

export const urlToBlob = async (url: string) => {
  const image = await loadImage(url);
  return imageToBlob(image);
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

export const canvasToBase64 = (canvas: HTMLCanvasElement) => {
  const dataURL = canvas.toDataURL('image/jpeg');
  console.log(dataURL);
  return dataURL.substring(dataURL.indexOf(',') + 1);
};

export const base64ToImageData = async (base64: string) => {
  const image = await loadImage('data:image/jpeg;base64,' + base64);
  const imageData = imageToImageData(image);
  return imageData;
};

export const imageDataToBlob = async (imageData: ImageData) => {
  const canvas = getCanvas();
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  ctx.putImageData(imageData, 0, 0);
  const blob = await canvasToBlob(canvas);
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
