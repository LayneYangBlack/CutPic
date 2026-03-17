<template>
  <div class="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 printable-hidden">
    <!-- Left Panel: File Upload & Order List -->
    <div class="space-y-6">
      <h1 class="text-2xl font-bold">JSON自动排版工具</h1>

      <!-- Step 1: 说明 -->
      <div class="p-4 border rounded-lg bg-white shadow-sm">
        <h2 class="text-lg font-semibold mb-2">使用说明</h2>
        <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <p class="mb-1">✨ <strong>自动解析订单：</strong></p>
          <ul class="list-disc list-inside space-y-1 ml-2">
            <li>上传包含订单文件的ZIP压缩包</li>
            <li>自动识别json、原图、预览图</li>
            <li>自动截取并生成徽章</li>
            <li>支持批量上传多个ZIP文件</li>
          </ul>
        </div>
      </div>

      <!-- Step 2: ZIP Upload -->
      <div class="p-4 border rounded-lg bg-white shadow-sm">
        <h2 class="text-lg font-semibold mb-4">1. 上传ZIP文件</h2>
        <div class="flex flex-col gap-3">
          <input
            type="file"
            ref="zipInput"
            accept=".zip"
            multiple
            @change="handleZipUpload"
            class="hidden"
          >
          <button
            @click="$refs.zipInput.click()"
            class="px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
          >
            📦 选择ZIP文件（可多选）
          </button>
          <p v-if="orders.length > 0" class="text-sm text-gray-600">
            已解析 {{ orders.length }} 个订单
          </p>
          <p class="text-xs text-gray-500">
            💡 ���个ZIP包应包含：定制json文件、原图、预览图
          </p>
        </div>
      </div>

      <!-- Step 3: Order List -->
      <div class="p-4 border rounded-lg bg-white shadow-sm">
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-semibold">2. 订单列表</h2>
          <div v-if="orders.length > 0" class="flex gap-2 items-center">
            <button
              @click="toggleSelectAll"
              class="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
            >
              {{ allSelected ? '取消全选' : '全选' }}
            </button>
            <span class="text-sm text-gray-600">
              已选择 {{ selectedCount }} / {{ orders.length }} 个订单
            </span>
          </div>
        </div>
        <div v-if="orders.length === 0" class="text-center text-gray-500 py-8">
          暂无订单，请上传ZIP文件
        </div>
        <div v-else class="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div v-for="order in orders" :key="order.id" class="p-3 border rounded-md bg-gray-50 space-y-3">
            <!-- 订单标题 -->
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2">
                <!-- 复选框 -->
                <input
                  type="checkbox"
                  v-model="order.selected"
                  class="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  @change="forceUpdate"
                >
                <!-- 订单ID -->
                <div class="font-medium text-sm">订单 #{{ order.orderId }}</div>
                <!-- 已打印标识 -->
                <span
                  v-if="order.printed"
                  class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded"
                >
                  ✓ 已打印
                </span>
              </div>
              <button @click="removeOrder(order.id)" class="text-red-500 hover:text-red-700 text-xs">
                移除
              </button>
            </div>

            <!-- 图片预览 -->
            <div class="grid grid-cols-3 gap-2">
              <!-- 预览图 -->
              <div class="text-center">
                <div class="w-full aspect-square bg-gray-200 rounded overflow-hidden mb-1">
                  <img v-if="order.previewImageSrc" :src="order.previewImageSrc" class="w-full h-full object-cover" alt="预览图">
                </div>
                <p class="text-xs text-gray-600">预览图</p>
              </div>
              <!-- 原图 -->
              <div class="text-center">
                <div class="w-full aspect-square bg-gray-200 rounded overflow-hidden mb-1">
                  <img v-if="order.originalImageSrc" :src="order.originalImageSrc" class="w-full h-full object-cover" alt="原图">
                </div>
                <p class="text-xs text-gray-600">原图</p>
              </div>
              <!-- 截取后的徽章 -->
              <div class="text-center">
                <div class="w-full aspect-square bg-gray-200 rounded-full overflow-hidden mb-1">
                  <img v-if="order.croppedImageSrc" :src="order.croppedImageSrc" class="w-full h-full object-cover" alt="徽章">
                  <div v-else-if="order.processing" class="w-full h-full flex items-center justify-center text-xs text-gray-500">
                    处理中...
                  </div>
                </div>
                <p class="text-xs text-gray-600">徽章</p>
              </div>
            </div>

            <!-- 订单信息 -->
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <label class="block text-xs font-medium text-gray-700">尺寸</label>
                <select v-model="order.size" class="mt-1 block w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs">
                  <option v-for="(outer, inner) in sizeMap" :key="inner" :value="inner">{{ inner }}mm</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700">数量</label>
                <input type="number" v-model.number="order.quantity" min="1" class="mt-1 block w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs">
              </div>
            </div>

            <!-- 错误信息 -->
            <div v-if="order.error" class="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {{ order.error }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel: A4 Preview -->
    <div class="p-4 border rounded-lg bg-white shadow-sm">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">3. A4 预览和打印</h2>
        <div class="flex gap-2">
          <button @click="generateLayout" :disabled="!allOrdersReady" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 text-sm">
            生成排版
          </button>
          <button @click="printLayout" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
            打印
          </button>
        </div>
      </div>

      <!-- 分页提示 -->
      <div v-if="generatedPages.length > 1" class="mb-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
        已生成 {{ generatedPages.length }} 页排版，点击打印将打印所有页面
      </div>

      <div class="bg-gray-200 p-2 a4-preview-container overflow-auto shadow-inner rounded">
        <canvas ref="a4Canvas"></canvas>
      </div>

      <!-- 多页预览缩略图 -->
      <div v-if="generatedPages.length > 1" class="mt-4">
        <h3 class="text-sm font-semibold mb-2">所有页面预览：</h3>
        <div class="grid grid-cols-3 gap-2">
          <div v-for="(page, index) in generatedPages" :key="index" class="border rounded p-1 bg-white">
            <img :src="page" class="w-full h-auto" :alt="`第 ${index + 1} 页`">
            <p class="text-xs text-center text-gray-600 mt-1">第 {{ index + 1 }} 页</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <img ref="printableImage" class="printable-area screen-hidden" alt="Printable Layout">
</template>

<script setup>
import { ref, computed } from 'vue';
import JSZip from 'jszip';

// --- 尺寸映射表 ---
const sizeMap = {
  25: 35, 32: 44, 37: 49, 44: 54, 50: 61, 56: 66, 58: 70, 65: 76, 75: 86,
};

// --- 状态管理 ---
const zipInput = ref(null);
const orders = ref([]); // 订单列表
let nextOrderId = 1;

const a4Canvas = ref(null);
const printableImage = ref(null);
const generatedPages = ref([]); // 存储生成的多页canvas的dataURL数组

// --- 计算属性 ---
// 已选择的订单数量
const selectedCount = computed(() =>
  orders.value.filter(o => o.selected).length
);

// 是否全选
const allSelected = computed(() =>
  orders.value.length > 0 && orders.value.every(o => o.selected)
);

// 选中的订单
const selectedOrders = computed(() =>
  orders.value.filter(o => o.selected)
);

// 所有订单是否准备就绪（保留原有逻辑，用于按钮禁用）
const allOrdersReady = computed(() =>
  orders.value.length > 0 && orders.value.every(o => o.croppedImageSrc && !o.error)
);

// --- 订单选择功能 ---
/**
 * 全选/取消全选
 */
const toggleSelectAll = () => {
  const shouldSelect = !allSelected.value;
  orders.value.forEach(order => {
    order.selected = shouldSelect;
  });
  // 强制更新
  orders.value = [...orders.value];
};

/**
 * 强制更新（checkbox变化时）
 */
const forceUpdate = () => {
  orders.value = [...orders.value];
};

// --- ZIP文件上传处理 ---
/**
 * 处理ZIP文件上传事件
 * 支持多个ZIP文件同时上传
 */
const handleZipUpload = async (event) => {
  const files = Array.from(event.target.files);

  if (files.length === 0) return;

  for (const file of files) {
    // 验证文件格式
    if (!file.name.endsWith('.zip')) {
      alert(`文件 "${file.name}" 不是ZIP格式，已跳过`);
      continue;
    }

    try {
      await processZipFile(file);
    } catch (error) {
      console.error(`处理ZIP文件 "${file.name}" 失败:`, error);
      alert(`处理ZIP文件 "${file.name}" 失败: ${error.message}`);
    }
  }

  // 清空input，允许重复选择同一文件
  event.target.value = '';
};

/**
 * 处理单个ZIP文件
 * 解压并识别json、原图、预览图
 */
const processZipFile = async (file) => {
  // 提取订单ID（从文件名）
  const orderId = file.name.replace('.zip', '');

  // 创建订单对象（先添加到列表，显示处理中状态）
  const order = {
    id: nextOrderId++,
    orderId,
    selected: false, // 是否选中
    printed: false,  // 是否已打印
    originalImageSrc: null,
    previewImageSrc: null,
    croppedImageSrc: null,
    size: 58, // 默认尺寸
    quantity: 1,
    processing: true,
    error: null,
  };

  orders.value.push(order);

  try {
    // 1. 加载ZIP文件
    const zip = await JSZip.loadAsync(file);

    // 2. 查找JSON文件
    const jsonFiles = [];
    zip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir && /\.json$/i.test(relativePath)) {
        jsonFiles.push(zipEntry);
      }
    });

    if (jsonFiles.length === 0) {
      throw new Error('ZIP包中未找到JSON文件');
    }

    // 读取第一个JSON文件
    const jsonFile = jsonFiles[0];
    const jsonContent = await jsonFile.async('string');
    const jsonData = JSON.parse(jsonContent);

    // 3. 查找图片文件
    const imageFiles = [];
    zip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir && /\.(png|jpg|jpeg)$/i.test(relativePath)) {
        imageFiles.push({ path: relativePath, entry: zipEntry });
      }
    });

    if (imageFiles.length === 0) {
      throw new Error('ZIP包中未找到图片文件');
    }

    // 识别原图和预览图
    const originalImageFile = imageFiles.find(f =>
      f.path.includes('原图') || f.path.includes('消费者上传')
    );
    const previewImageFile = imageFiles.find(f =>
      f.path.includes('预览') || f.path.includes('合成')
    );

    if (!originalImageFile) {
      throw new Error('ZIP包中未找到原图（文件名应包含"原图"或"消费者上传"）');
    }

    // 4. 读取原图为base64
    const originalImageBase64 = await originalImageFile.entry.async('base64');
    // 自动识别图片格式
    const originalImageExt = originalImageFile.path.split('.').pop().toLowerCase();
    const originalImageMimeType = originalImageExt === 'png' ? 'image/png' : 'image/jpeg';
    order.originalImageSrc = `data:${originalImageMimeType};base64,${originalImageBase64}`;

    // 5. 读取预览图（如果有）
    if (previewImageFile) {
      const previewImageBase64 = await previewImageFile.entry.async('base64');
      const previewImageExt = previewImageFile.path.split('.').pop().toLowerCase();
      const previewImageMimeType = previewImageExt === 'png' ? 'image/png' : 'image/jpeg';
      order.previewImageSrc = `data:${previewImageMimeType};base64,${previewImageBase64}`;
    }

    // 6. 执行截取
    order.croppedImageSrc = await cropImageFromJson(order.originalImageSrc, jsonData);

    // 7. 更新订单状态
    order.processing = false;

    // 强制触发Vue响应式更新
    orders.value = [...orders.value];

  } catch (error) {
    console.error('处理ZIP文件失败:', error);
    order.error = `处理失败: ${error.message}`;
    order.processing = false;

    // 强制触发Vue响应式更新
    orders.value = [...orders.value];
  }
};

/**
 * 移除订单
 */
const removeOrder = (id) => {
  orders.value = orders.value.filter(o => o.id !== id);
};

/**
 * 从json数据中截取图片
 * 应用缩放、旋转、位置变换，生成圆形徽章
 */
const cropImageFromJson = async (originalImageSrc, jsonData) => {
  return new Promise((resolve, reject) => {
    try {
      // 验证JSON结构
      if (!jsonData || !jsonData.surfaces || !jsonData.surfaces[0]) {
        throw new Error('JSON格式错误：缺少surfaces数据');
      }

      const surface = jsonData.surfaces[0];

      if (!surface.regions || !surface.regions[0]) {
        throw new Error('JSON格式错误：缺少regions数据');
      }

      const region = surface.regions[0];

      if (!region.elements || !region.elements[0]) {
        throw new Error('JSON格式错误：缺少elements数据');
      }

      const element = region.elements[0];

      // 支持两种命名方式：驼峰命名和下划线命名
      const placement = element.userPlacementData || element.user_placement_data;

      if (!placement) {
        throw new Error('JSON格式错误：缺少userPlacementData或user_placement_data数据');
      }

      // 验证必需字段
      if (!region.dimension || !region.position) {
        throw new Error('JSON格式错误：缺少region的dimension或position');
      }

      if (!placement.dimension || !placement.position || !placement.scale) {
        throw new Error('JSON格式错误：缺少placement的dimension、position或scale');
      }

      // 定制区域尺寸
      const regionWidth = region.dimension.width;
      const regionHeight = region.dimension.height;
      const regionX = region.position.x;
      const regionY = region.position.y;

      // 用户图片信息（支持两种命名方式）
      const userImageWidth = placement.dimension.width;
      const userImageHeight = placement.dimension.height;
      const userImageX = placement.position.x;
      const userImageY = placement.position.y;
      const scaleX = placement.scale.scaleX || placement.scale.scale_x;
      const scaleY = placement.scale.scaleY || placement.scale.scale_y;
      const rotation = placement.angleOfRotation || placement.angle_of_rotation || 0;

      // 加载原图
      const img = new Image();
      img.onload = () => {
        // 创建临时canvas用于变换
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = regionWidth;
        tempCanvas.height = regionHeight;
        const tempCtx = tempCanvas.getContext('2d');

        // 填充白色背景
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, regionWidth, regionHeight);

        // 保存上下文状态
        tempCtx.save();

        // 计算用户图片相对于定制区域的位置
        const relativeX = userImageX - regionX;
        const relativeY = userImageY - regionY;

        // 移动到图片中心点（注意：这里要考虑缩放后的尺寸）
        const scaledWidth = userImageWidth * scaleX;
        const scaledHeight = userImageHeight * scaleY;
        tempCtx.translate(relativeX + scaledWidth / 2, relativeY + scaledHeight / 2);

        // 应用旋转
        tempCtx.rotate((rotation * Math.PI) / 180);

        // 应用缩放
        tempCtx.scale(scaleX, scaleY);

        // 绘制图片（以中心点为原点）
        tempCtx.drawImage(
          img,
          -userImageWidth / 2,
          -userImageHeight / 2,
          userImageWidth,
          userImageHeight
        );

        tempCtx.restore();

        // 创建圆形蒙版canvas
        const circleCanvas = document.createElement('canvas');
        circleCanvas.width = regionWidth;
        circleCanvas.height = regionHeight;
        const circleCtx = circleCanvas.getContext('2d');

        // 绘制圆形裁剪路径
        circleCtx.beginPath();
        circleCtx.arc(regionWidth / 2, regionHeight / 2, regionWidth / 2, 0, Math.PI * 2);
        circleCtx.closePath();
        circleCtx.clip();

        // 绘制变换后的图片
        circleCtx.drawImage(tempCanvas, 0, 0);

        // 返回dataURL
        resolve(circleCanvas.toDataURL('image/png'));
      };

      img.onerror = (error) => {
        reject(new Error('图片加载失败'));
      };

      img.src = originalImageSrc;
    } catch (error) {
      reject(error);
    }
  });
};
const generateLayout = () => {
  // 获取选中的订单
  const selected = orders.value.filter(o => o.selected);

  // 检查是否有选中的订单
  if (selected.length === 0) {
    alert('请先选择要排版的订单！');
    return;
  }

  // 检查选中的订单是否都已处理完成
  if (selected.some(o => !o.croppedImageSrc || o.error)) {
    alert('请确保选中的订单都已处理完成！');
    return;
  }

  // 检查选中的订单规格是否一致
  const sizes = new Set(selected.map(o => o.size));
  if (sizes.size > 1) {
    const sizeList = Array.from(sizes).sort((a, b) => a - b).join('mm, ') + 'mm';
    alert(`❌ 多图排版仅支持相同尺寸的徽章！\\n\\n选中的订单包含多个尺寸：${sizeList}\\n\\n请取消选择不同尺寸的订单。`);
    return;
  }

  const DPI = 300;
  const MM_PER_INCH = 25.4;
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;
  const mmToPx = (mm) => (mm / MM_PER_INCH) * DPI;

  // 准备所有要排版的徽章（展开数量）- 只使用选中的订单
  const allBadges = [];
  selected.forEach(order => {
    for (let i = 0; i < (order.quantity || 1); i++) {
      allBadges.push({
        size: order.size,
        croppedImageSrc: order.croppedImageSrc,
        outerDiameter: sizeMap[order.size],
      });
    }
  });

  // 按尺寸排序（大到小）
  allBadges.sort((a, b) => b.outerDiameter - a.outerDiameter);

  // 计算单页能放多少个徽章（使用CDR模式参数）
  const cdrMarginTop = 5;
  const cdrMarginBottom = 5;
  const cdrMarginLeft = 5;
  const cdrMarginRight = 5;
  const cdrSpacingH = 2.0;
  const cdrSpacingV = 2.0;
  const cdrEdgePaddingH = 2.0;
  const cdrEdgePaddingV = 2.0;
  const cdrAllowedOverflow = 5;

  const allowedOverflowPx = mmToPx(cdrAllowedOverflow);
  const edgePaddingHPx = mmToPx(cdrEdgePaddingH);
  const edgePaddingVPx = mmToPx(cdrEdgePaddingV);
  const marginLeftPx = mmToPx(cdrMarginLeft);
  const marginRightPx = mmToPx(cdrMarginRight);
  const marginTopPx = mmToPx(cdrMarginTop);
  const marginBottomPx = mmToPx(cdrMarginBottom);

  const effectiveCanvasWidth = mmToPx(A4_WIDTH_MM) - marginLeftPx - marginRightPx - 2 * edgePaddingHPx + 2 * allowedOverflowPx;
  const effectiveCanvasHeight = mmToPx(A4_HEIGHT_MM) - marginTopPx - marginBottomPx - 2 * edgePaddingVPx + 2 * allowedOverflowPx;
  const currentGapHPx = mmToPx(cdrSpacingH);
  const currentGapVPx = mmToPx(cdrSpacingV);

  const sampleBadge = allBadges[0];
  const outerDiaPx = mmToPx(sampleBadge.outerDiameter);

  const colsPerPage = Math.floor((effectiveCanvasWidth + currentGapHPx) / (outerDiaPx + currentGapHPx));
  const rowsPerPage = Math.floor((effectiveCanvasHeight + currentGapVPx) / (outerDiaPx + currentGapVPx));
  const badgesPerPage = colsPerPage * rowsPerPage;

  if (badgesPerPage === 0) {
    alert('徽章尺寸过大，无法在A4纸上进行排版！');
    return;
  }

  // 计算需要多少页
  const totalPages = Math.ceil(allBadges.length / badgesPerPage);
  console.log(`总共 ${allBadges.length} 个徽章，每页 ${badgesPerPage} 个，需要 ${totalPages} 页`);

  // 清空之前的页面
  generatedPages.value = [];

  // 为每一页生成排版
  const generatePage = (pageIndex) => {
    return new Promise((resolve, reject) => {
      const startIdx = pageIndex * badgesPerPage;
      const endIdx = Math.min(startIdx + badgesPerPage, allBadges.length);
      const pageBadges = allBadges.slice(startIdx, endIdx);

      // 判断当前页是否满张
      const isFullPage = pageBadges.length === badgesPerPage;
      const actualDrawMode = isFullPage ? 'cdr' : 'outline';

      // 创建临时canvas
      const canvas = document.createElement('canvas');
      canvas.width = mmToPx(A4_WIDTH_MM);
      canvas.height = mmToPx(A4_HEIGHT_MM);
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // CDR模式：绘制四个角的实心圆标记
      if (actualDrawMode === 'cdr') {
        const markerDiameter = mmToPx(5);
        const markerRadius = markerDiameter / 2;

        ctx.fillStyle = 'black';
        // 左上角
        ctx.beginPath();
        ctx.arc(marginLeftPx, marginTopPx, markerRadius, 0, Math.PI * 2);
        ctx.fill();
        // 右上角
        ctx.beginPath();
        ctx.arc(canvas.width - marginRightPx, marginTopPx, markerRadius, 0, Math.PI * 2);
        ctx.fill();
        // 左下角
        ctx.beginPath();
        ctx.arc(marginLeftPx, canvas.height - marginBottomPx, markerRadius, 0, Math.PI * 2);
        ctx.fill();
        // 右下角
        ctx.beginPath();
        ctx.arc(canvas.width - marginRightPx, canvas.height - marginBottomPx, markerRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 计算起始位置（居中）
      let offsetX, offsetY;

      if (actualDrawMode === 'cdr') {
        const totalBadgesWidth = colsPerPage * outerDiaPx + (colsPerPage - 1) * currentGapHPx;
        const totalBadgesHeight = rowsPerPage * outerDiaPx + (rowsPerPage - 1) * currentGapVPx;

        const effectiveWidthForCentering = effectiveCanvasWidth;
        const effectiveHeightForCentering = effectiveCanvasHeight;

        offsetX = marginLeftPx + edgePaddingHPx - allowedOverflowPx + (effectiveWidthForCentering - totalBadgesWidth) / 2;
        offsetY = marginTopPx + edgePaddingVPx - allowedOverflowPx + (effectiveHeightForCentering - totalBadgesHeight) / 2;
      } else {
        // 外圆切线模式
        const minGapMM = sampleBadge.size <= 32 ? 4 : 2;
        const minGapPx = mmToPx(minGapMM);

        const autoModeCols = Math.floor((mmToPx(A4_WIDTH_MM) + minGapPx) / (outerDiaPx + minGapPx));
        const autoModeRows = Math.floor((mmToPx(A4_HEIGHT_MM) + minGapPx) / (outerDiaPx + minGapPx));

        const totalBadgesWidth = autoModeCols * outerDiaPx;
        const remainingWidth = mmToPx(A4_WIDTH_MM) - totalBadgesWidth;
        const horizontalGap = remainingWidth / (autoModeCols + 1);

        const totalBadgesHeight = autoModeRows * outerDiaPx;
        const remainingHeight = mmToPx(A4_HEIGHT_MM) - totalBadgesHeight;
        const verticalGap = remainingHeight / (autoModeRows + 1);

        offsetX = horizontalGap;
        offsetY = verticalGap;
      }

      // 加载所有图片并绘制
      const imageLoadPromises = pageBadges.map(badge => {
        return new Promise((resolveImg, rejectImg) => {
          const img = new Image();
          img.onload = () => resolveImg({ badge, img });
          img.onerror = rejectImg;
          img.src = badge.croppedImageSrc;
        });
      });

      Promise.all(imageLoadPromises).then(loadedImages => {
        // 根据绘制模式选择实际使用的间距
        let actualGapHPx, actualGapVPx;

        if (actualDrawMode === 'cdr') {
          actualGapHPx = currentGapHPx;
          actualGapVPx = currentGapVPx;
        } else {
          const minGapMM = sampleBadge.size <= 32 ? 4 : 2;
          const minGapPx = mmToPx(minGapMM);
          const autoModeCols = Math.floor((mmToPx(A4_WIDTH_MM) + minGapPx) / (outerDiaPx + minGapPx));
          const autoModeRows = Math.floor((mmToPx(A4_HEIGHT_MM) + minGapPx) / (outerDiaPx + minGapPx));

          const totalBadgesWidth = autoModeCols * outerDiaPx;
          const remainingWidth = mmToPx(A4_WIDTH_MM) - totalBadgesWidth;
          const horizontalGap = remainingWidth / (autoModeCols + 1);

          const totalBadgesHeight = autoModeRows * outerDiaPx;
          const remainingHeight = mmToPx(A4_HEIGHT_MM) - totalBadgesHeight;
          const verticalGap = remainingHeight / (autoModeRows + 1);

          actualGapHPx = horizontalGap;
          actualGapVPx = verticalGap;
        }

        loadedImages.forEach(({ badge, img }, index) => {
          const row = Math.floor(index / colsPerPage);
          const col = index % colsPerPage;
          const x = offsetX + col * (outerDiaPx + actualGapHPx);
          const y = offsetY + row * (outerDiaPx + actualGapVPx);

          const innerDiaPx = mmToPx(badge.size);

          // 外圆切线模式：绘制虚线外圆
          if (actualDrawMode === 'outline') {
            ctx.save();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 2]);
            ctx.beginPath();
            ctx.arc(x + outerDiaPx / 2, y + outerDiaPx / 2, outerDiaPx / 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // 绘制内圆图片
          ctx.save();
          ctx.beginPath();
          ctx.arc(x + outerDiaPx / 2, y + outerDiaPx / 2, innerDiaPx / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, x + (outerDiaPx - innerDiaPx) / 2, y + (outerDiaPx - innerDiaPx) / 2, innerDiaPx, innerDiaPx);
          ctx.restore();
        });

        // 在页面底部添加尺寸信息
        ctx.fillStyle = 'black';
        ctx.font = `${mmToPx(4)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(
          `${sampleBadge.size}`,
          canvas.width / 2,
          canvas.height - mmToPx(5)
        );

        // 转为dataURL并存储
        const pageDataUrl = canvas.toDataURL('image/png');
        generatedPages.value.push(pageDataUrl);

        // 如果是第一页，显示在预览区
        if (pageIndex === 0) {
          const mainCanvas = a4Canvas.value;
          mainCanvas.width = canvas.width;
          mainCanvas.height = canvas.height;
          const mainCtx = mainCanvas.getContext('2d');
          const previewImg = new Image();
          previewImg.onload = () => {
            mainCtx.drawImage(previewImg, 0, 0);
          };
          previewImg.src = pageDataUrl;
        }

        resolve();
      }).catch(error => {
        console.error('加载图片失败:', error);
        reject(error);
      });
    });
  };

  // 依次生成所有页面
  const generateAllPages = async () => {
    for (let i = 0; i < totalPages; i++) {
      await generatePage(i);
    }

    // 排版成功后，标记选中的订单为已打印
    selected.forEach(order => {
      order.printed = true;
    });

    // 强制更新
    orders.value = [...orders.value];

    alert(`排版完成！共生成 ${totalPages} 页。`);
  };

  generateAllPages().catch(error => {
    console.error('生成排版失败:', error);
    alert('生成排版时出错，请重试！');
  });
};

// --- 打印逻辑 ---
const printLayout = () => {
  if (generatedPages.value.length > 0) {
    const printContainer = document.createElement('div');
    printContainer.className = 'printable-area';

    generatedPages.value.forEach((pageDataUrl, index) => {
      const img = document.createElement('img');
      img.src = pageDataUrl;
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.pageBreakAfter = index < generatedPages.value.length - 1 ? 'always' : 'auto';
      printContainer.appendChild(img);
    });

    document.body.appendChild(printContainer);

    const images = printContainer.querySelectorAll('img');
    let loadedCount = 0;
    images.forEach(img => {
      if (img.complete) {
        loadedCount++;
      } else {
        img.onload = () => {
          loadedCount++;
          if (loadedCount === images.length) {
            window.print();
            setTimeout(() => {
              if (document.body.contains(printContainer)) {
                document.body.removeChild(printContainer);
              }
            }, 1000);
          }
        };
      }
    });

    if (loadedCount === images.length) {
      window.print();
      setTimeout(() => {
        if (document.body.contains(printContainer)) {
          document.body.removeChild(printContainer);
        }
      }, 1000);
    }
  } else {
    alert('请先生成排版！');
  }
};
</script>


<style scoped>
.a4-preview-container {
  aspect-ratio: 210 / 297;
  width: 100%;
}
canvas {
  width: 100%;
  height: 100%;
}
.screen-hidden {
  position: absolute;
  top: -9999px;
  left: -9999px;
}

/* 平时隐藏打印区域 */
.printable-area {
  position: absolute;
  left: -9999px;
  top: -9999px;
  visibility: hidden;
}

@media print {
  @page {
    margin: 0;
    size: A4;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  body * {
    visibility: hidden;
  }
  .printable-area, .printable-area * {
    visibility: visible;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .printable-area {
    position: absolute;
    left: 0 !important;
    top: 0 !important;
    width: 100%;
    height: auto;
  }
  .printable-hidden {
    display: none;
  }
}
</style>

