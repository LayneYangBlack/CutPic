/**
 * 文字水印工具
 * 在图片上叠加尺寸规格水印文字，火焰红艺术字样式
 */

// 7 种规格文案
export const SIZE_LABELS = [
  '25mm/0.98inch',
  '32mm/1.26inch',
  '37mm/1.46inch',
  '44mm/1.73inch',
  '50mm/1.97inch',
  '56mm/2.20inch',
  '58mm/2.28inch',
];

/**
 * 在图片上添加文字水印
 * @param {string} imageDataUrl - 原图 DataURL
 * @param {string} text - 水印文字
 * @param {object} options
 * @param {string} options.position - 'bottom-right' | 'top-left'
 * @param {number} options.fontSize - 字号（默认根据图片宽度自适应）
 * @returns {Promise<string>} 带水印的 DataURL
 */
export function addTextWatermark(imageDataUrl, text, options = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      // 绘制原图
      ctx.drawImage(img, 0, 0);

      // 字号自适应（图片宽度的 5%，最小 24px，最大 72px）
      const fontSize = options.fontSize || Math.max(24, Math.min(72, Math.round(canvas.width * 0.05)));
      const padding = fontSize * 0.8; // 边距

      // 火焰红艺术字样式
      ctx.font = `bold ${fontSize}px "Arial Black", "Impact", sans-serif`;
      ctx.textBaseline = 'middle';

      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;

      // 计算位置
      let x, y;
      const position = options.position || 'bottom-right';
      if (position === 'bottom-right') {
        x = canvas.width - textWidth - padding;
        y = canvas.height - padding;
      } else {
        // top-left
        x = padding;
        y = padding + textHeight / 2;
      }

      // 半透明黑色背景条（提高可读性）
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      const bgPadX = fontSize * 0.3;
      const bgPadY = fontSize * 0.2;
      ctx.beginPath();
      ctx.roundRect(
        x - bgPadX,
        y - textHeight / 2 - bgPadY,
        textWidth + bgPadX * 2,
        textHeight + bgPadY * 2,
        fontSize * 0.15
      );
      ctx.fill();

      // 火焰红渐变文字
      const gradient = ctx.createLinearGradient(x, y - textHeight / 2, x, y + textHeight / 2);
      gradient.addColorStop(0, '#FF4500');   // 橙红
      gradient.addColorStop(0.4, '#FF0000'); // 正红
      gradient.addColorStop(0.7, '#CC0000'); // 深红
      gradient.addColorStop(1, '#FF6600');   // 火焰橙

      // 外发光效果
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = fontSize * 0.3;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // 描边（深色轮廓）
      ctx.strokeStyle = '#330000';
      ctx.lineWidth = fontSize * 0.06;
      ctx.strokeText(text, x, y);

      // 填充渐变
      ctx.fillStyle = gradient;
      ctx.fillText(text, x, y);

      // 清除阴影，加一层高光
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#FFFF00'; // 黄色高光
      ctx.fillText(text, x, y - fontSize * 0.02);
      ctx.globalAlpha = 1;

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('水印图片加载失败'));
    img.src = imageDataUrl;
  });
}

/**
 * 批量生成 7 种规格水印图
 * @param {string} imageDataUrl - 原图 DataURL
 * @param {string} position - 'bottom-right' | 'top-left'
 * @returns {Promise<Array<{label: string, dataUrl: string}>>}
 */
export async function generateSizeWatermarks(imageDataUrl, position = 'bottom-right') {
  const results = [];
  for (const label of SIZE_LABELS) {
    const watermarked = await addTextWatermark(imageDataUrl, label, { position });
    results.push({ label, dataUrl: watermarked });
  }
  return results;
}
