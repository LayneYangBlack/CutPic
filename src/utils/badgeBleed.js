/**
 * 吧唧（马口铁徽章）出血/包边相关：四个排版模式共用
 *
 * 尺寸关系：成品直径 < 外圈直径（外圈 = 成品 + 2×包边，见各组件 sizeMap）
 * - 成品线：压制完成后正面能看到的范围，线以内的图案是正面图案
 * - 包边（成品线 → 外圈）：面纸折到背面的部分，本工具按"包边也印图案"处理，图案等比放大铺满整个外圈
 */

/**
 * 把成品线画到"参考线图层"。
 * 参考线只在屏幕预览的独立画布上绘制，不写进打印用的画布，避免被印到纸上。
 */
export function drawBadgeGuide(ctx, { x, y, cellDiaPx, sizeDiaPx, mmToPx }) {
  const centerX = x + cellDiaPx / 2;
  const centerY = y + cellDiaPx / 2;

  ctx.save();
  // 预览是缩小显示的，线太细会看不见，0.4mm 在缩放后仍能看清
  ctx.lineWidth = Math.max(1.5, mmToPx(0.4));
  ctx.setLineDash([mmToPx(1.5), mmToPx(1.5)]);

  // 成品线：灰色，线内是正面图案，线外到外圈都是包边
  ctx.strokeStyle = '#9ca3af';
  ctx.beginPath();
  ctx.arc(centerX, centerY, sizeDiaPx / 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * 图案绘制直径：开启出血后图案等比放大铺满整个单元圆（出血区 + 包边区都有图），
 * 关闭时维持旧行为（只画到成品线，外圈留白）
 */
export const getDrawDiameterMM = ({ bleedEnabled, size, outerDiameter }) =>
  bleedEnabled ? outerDiameter : size;
