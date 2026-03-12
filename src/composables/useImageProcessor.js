/**
 * 图像处理 Composable
 * 提供裁剪、擦除水印、批量处理等核心功能
 */
import { loadImage, canvasToBlob } from '../utils/imageUtils.js';
import inpaint from '../adapters/inpainting.js';
import cv from 'opencv-ts';

export function useImageProcessor() {
  /**
   * 裁剪并调整图片大小
   * @param {string|HTMLImageElement} imageSource - 图片源（URL或Image元素）
   * @param {Object} cropArea - 裁剪区域 {x, y, width, height}
   * @param {number} targetWidth - 目标宽度
   * @param {number} targetHeight - 目标高度
   * @returns {Promise<Blob>} 裁剪后的图片Blob
   */
  const cropAndResize = async (imageSource, cropArea, targetWidth, targetHeight) => {
    // 加载图片
    const img = typeof imageSource === 'string'
      ? await loadImage(imageSource)
      : imageSource;

    // 创建Canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');

    // 绘制裁剪区域到目标尺寸
    ctx.drawImage(
      img,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height, // 源区域
      0, 0, targetWidth, targetHeight // 目标区域
    );

    // 转换为Blob
    return canvasToBlob(canvas);
  };

  /**
   * 擦除水印（使用ONNX模型或OpenCV进行智能修复）
   * @param {string|HTMLImageElement} imageSource - 图片源
   * @param {string|HTMLCanvasElement} maskSource - 蒙版源（红色区域为需要擦除的区域）
   * @returns {Promise<Blob>} 修复后的图片Blob
   */
  const eraseWatermark = async (imageSource, maskSource) => {
    console.log('=== 开始擦除水印 ===');
    console.log('图片源类型:', typeof imageSource);
    console.log('蒙版源类型:', typeof maskSource);

    // 加载图片
    const img = typeof imageSource === 'string'
      ? await loadImage(imageSource)
      : imageSource;

    console.log('图片尺寸:', img.width, 'x', img.height);

    // 将蒙版转换为黑白图（白色=需要修复的区域）
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = img.width;
    maskCanvas.height = img.height;
    const maskCtx = maskCanvas.getContext('2d');

    if (typeof maskSource === 'string') {
      // 如果是URL，加载图片并绘制
      const maskImg = await loadImage(maskSource);
      console.log('蒙版图片尺寸:', maskImg.width, 'x', maskImg.height);
      maskCtx.drawImage(maskImg, 0, 0, img.width, img.height);
    } else {
      // 如果是Canvas，缩放到图片尺寸
      console.log('蒙版Canvas尺寸:', maskSource.width, 'x', maskSource.height);
      maskCtx.drawImage(maskSource, 0, 0, img.width, img.height);
    }

    // 将红色蒙版转换为黑白蒙版（红色区域变为白色，其他区域变为黑色）
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    for (let i = 0; i < maskData.data.length; i += 4) {
      const r = maskData.data[i];
      const a = maskData.data[i + 3];

      // 如果是红色区域（alpha > 0 且红色通道 > 30），设置为白色
      if (a > 0 && r > 30) {
        maskData.data[i] = 255;     // R
        maskData.data[i + 1] = 255; // G
        maskData.data[i + 2] = 255; // B
        maskData.data[i + 3] = 255; // A
      } else {
        // 其他区域设置为黑色
        maskData.data[i] = 0;       // R
        maskData.data[i + 1] = 0;   // G
        maskData.data[i + 2] = 0;   // B
        maskData.data[i + 3] = 255; // A
      }
    }
    maskCtx.putImageData(maskData, 0, 0);

    // 尝试使用ONNX模型，如果失败则降级到OpenCV
    try {
      console.log('尝试使用ONNX模型进行修复...');
      const maskDataURL = maskCanvas.toDataURL();
      const resultDataURL = await inpaint(img, maskDataURL);
      console.log('ONNX修复完成');

      // 将DataURL转换为Blob
      const response = await fetch(resultDataURL);
      const blob = await response.blob();
      console.log('=== 擦除水印完成（ONNX）===');
      return blob;
    } catch (error) {
      console.warn('ONNX模型修复失败，降级到OpenCV inpaint:', error.message);

      // 使用OpenCV inpaint作为降级方案
      const src = cv.imread(img);
      const mask = cv.imread(maskCanvas);

      // 转换蒙版为灰度图
      const maskGray = new cv.Mat();
      cv.cvtColor(mask, maskGray, cv.COLOR_RGBA2GRAY);

      // 创建输出Mat
      const dst = new cv.Mat();

      // 使用Telea算法进行修复（inpaintRadius=3）
      cv.inpaint(src, maskGray, dst, 3, cv.INPAINT_TELEA);

      // 将结果转换为Canvas
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = img.width;
      resultCanvas.height = img.height;
      cv.imshow(resultCanvas, dst);

      // 清理OpenCV Mat对象
      src.delete();
      mask.delete();
      maskGray.delete();
      dst.delete();

      // 转换为Blob
      const blob = await canvasToBlob(resultCanvas);
      console.log('=== 擦除水印完成（OpenCV）===');
      return blob;
    }
  };

  /**
   * 完整处理流程：裁剪 + 擦除水印
   * @param {string|HTMLImageElement} imageSource - 图片源
   * @param {Object} cropArea - 裁剪区域
   * @param {string|HTMLCanvasElement} maskSource - 蒙版源
   * @param {number} targetWidth - 目标宽度
   * @param {number} targetHeight - 目标高度
   * @returns {Promise<Blob>} 处理后的图片Blob
   */
  const processImage = async (imageSource, cropArea, maskSource, targetWidth, targetHeight) => {
    // 1. 先裁剪
    const croppedBlob = await cropAndResize(imageSource, cropArea, targetWidth, targetHeight);

    // 2. 如果有蒙版，则擦除水印
    if (maskSource) {
      const croppedUrl = URL.createObjectURL(croppedBlob);
      try {
        const finalBlob = await eraseWatermark(croppedUrl, maskSource);
        URL.revokeObjectURL(croppedUrl);
        return finalBlob;
      } catch (error) {
        URL.revokeObjectURL(croppedUrl);
        throw error;
      }
    }

    return croppedBlob;
  };

  return {
    cropAndResize,
    eraseWatermark,
    processImage
  };
}
