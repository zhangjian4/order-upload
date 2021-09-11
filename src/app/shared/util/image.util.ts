export const imageToBase64 = (image: HTMLImageElement) => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, image.width, image.height);
  let base64 = canvas.toDataURL('image/jpeg');
  base64 = base64.substr(base64.indexOf(',') + 1);
  return base64;
};

export const urlToBase64 = (url: string) =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.src = url;
    image.onload = () => {
      const base64 = imageToBase64(image);
      resolve(base64);
    };
    image.onerror = (e) => {
      reject(e);
    };
  });

export const base64ToArrayBuffer = (base64: string) => {
  const bstr = atob(base64);
  let n = bstr.length;
  const buffer: ArrayBuffer = new Uint8Array(n);
  while (n--) {
    buffer[n] = bstr.charCodeAt(n);
  }
  return buffer;
};

export const base64ToBlob = (base64: string) => {
  const buffer = base64ToArrayBuffer(base64);
  const blob = new Blob([buffer], {
    type: 'image/jpeg',
  });
  return blob;
};
