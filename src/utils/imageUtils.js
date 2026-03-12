/**
 * 图像工具函数
 * 提供图片加载、转换、下载等基础功能
 */

/**
 * 加载图片
 * @param {string|File} source - 图片源（URL或File对象）
 * @returns {Promise<HTMLImageElement>} 加载完成的图片元素
 */
export function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 允许跨域

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));

    if (source instanceof File) {
      // File对象：转换为DataURL
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(source);
    } else if (typeof source === 'string') {
      // URL字符串：直接加载
      img.src = source;
    } else {
      reject(new Error('不支持的图片源类型'));
    }
  });
}

/**
 * Canvas转Blob
 * @param {HTMLCanvasElement} canvas - Canvas元素
 * @param {string} type - 图片类型（默认image/png）
 * @param {number} quality - 图片质量（0-1，仅对image/jpeg有效）
 * @returns {Promise<Blob>} 图片Blob
 */
export function canvasToBlob(canvas, type = 'image/png', quality = 0.95) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas转Blob失败'));
        }
      },
      type,
      quality
    );
  });
}

/**
 * Blob转DataURL
 * @param {Blob} blob - Blob对象
 * @returns {Promise<string>} DataURL字符串
 */
export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Blob转DataURL失败'));
    reader.readAsDataURL(blob);
  });
}

/**
 * DataURL转Blob
 * @param {string} dataURL - DataURL字符串
 * @returns {Blob} Blob对象
 */
export function dataURLToBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * 下载Blob为文件
 * @param {Blob} blob - Blob对象
 * @param {string} filename - 文件名
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 释放URL对象
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * 计算适应容器的图片尺寸
 * @param {number} imgWidth - 图片宽度
 * @param {number} imgHeight - 图片高度
 * @param {number} maxWidth - 最大宽度
 * @param {number} maxHeight - 最大高度
 * @returns {{width: number, height: number}} 适应后的尺寸
 */
export function fitImageSize(imgWidth, imgHeight, maxWidth, maxHeight) {
  let width = imgWidth;
  let height = imgHeight;

  // 按宽度缩放
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  // 按高度缩放
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}

/**
 * 创建Canvas并绘制图片
 * @param {HTMLImageElement} img - 图片元素
 * @param {number} width - Canvas宽度
 * @param {number} height - Canvas高度
 * @returns {HTMLCanvasElement} Canvas元素
 */
export function createCanvasWithImage(img, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  return canvas;
}
