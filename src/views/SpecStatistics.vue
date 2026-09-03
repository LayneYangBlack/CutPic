<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold mb-4">规格数量统计</h1>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="mb-4">
          <label for="file-upload" class="block text-sm font-medium text-gray-700 mb-2">
            上传 Excel 文件
          </label>
          <div class="flex items-center">
            <input 
              id="file-upload" 
              type="file" 
              @change="handleFileUpload" 
              accept=".xlsx, .xls, .csv"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <p class="mt-1 text-xs text-gray-500">请确保 Excel 包含 '商品名称', '商品属性集', 和 '备货单' 列。</p>
        </div>

        <div v-if="isLoading" class="text-center">
          <p>正在计算中...</p>
        </div>

        <div v-if="!isLoading && statistics.length > 0" class="mt-6">
          <div class="flex justify-between items-center mb-3">
            <h2 class="text-xl font-semibold">统计结果</h2>
            <button
              @click="copyToClipboard"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center gap-2"
            >
              <span>📋</span>
              <span>复制表格数据</span>
            </button>
          </div>
          <div class="mb-3 text-lg font-bold text-gray-800 space-y-1">
            <div
              v-for="row in totalRows"
              :key="row.label"
              class="flex justify-between items-center"
              :class="row.sub ? 'text-base font-normal text-gray-500 pl-6' : ''"
            >
              <span>{{ row.label }}</span>
              <span>{{ row.value }}</span>
            </div>
            <div class="flex justify-between items-center border-t border-gray-200 pt-1">
              <span>总计</span>
              <span class="text-blue-600">{{ totalSum }}</span>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    规格
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    总数量
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="stat in statistics" :key="stat.spec">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ stat.spec }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ stat.total }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div v-if="error" class="mt-4 text-red-600">
          <p>发生错误: {{ error }}</p>
        </div>

        <div v-if="!isLoading && skippedRows.length > 0" class="mt-8">
          <h2 class="text-xl font-semibold mb-3 text-amber-600">未统计的行</h2>
          <p class="text-sm text-gray-600 mb-3">以下行由于格式不匹配或其他原因被跳过，请检查。</p>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">商品名称</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">商品属性集</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">备货单</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">跳过原因</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(row, index) in skippedRows" :key="index">
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{{ row['商品名称'] }}</td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{{ row['商品属性集'] }}</td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{{ row['备货单'] }}</td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-red-500">{{ row.reason }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import * as XLSX from 'xlsx';

const isLoading = ref(false);
const statistics = ref([]);
const totalSum = ref(0);
const totalRows = ref([]); // 分类合计行：{ label, value, sub }
const skippedRows = ref([]);
const error = ref(null);

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  isLoading.value = true;
  error.value = null;
  statistics.value = [];
  totalSum.value = 0;
  skippedRows.value = [];

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      processData(jsonData);

    } catch (err) {
      error.value = '文件解析失败，请确保是有效的 Excel 文件。 ' + err.message;
      console.error(err);
    } finally {
      isLoading.value = false;
    }
  };
  reader.onerror = (err) => {
      error.value = '读取文件时发生错误。';
      console.error(err);
      isLoading.value = false;
  };
  reader.readAsArrayBuffer(file);
};

// 复制表格数据到剪贴板（适合粘贴到Excel）
const copyToClipboard = async () => {
  try {
    // 构建制表符分隔的文本（Excel格式），规格不包含mm后缀
    const header = '规格\t总数量';
    const rows = statistics.value.map(stat => `${stat.spec.replace('mm', '')}\t${stat.total}`).join('\n');
    const totalLines = totalRows.value.map(row => `${row.label}\t${row.value}`).join('\n');
    const textToCopy = `${header}\n${rows}\n${totalLines}\n总计\t${totalSum.value}`;

    // navigator.clipboard 仅在安全上下文（HTTPS/localhost）下存在，
    // HTTP 部署环境会报 undefined，需降级用 execCommand 兜底
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(textToCopy);
    } else {
      // 兜底方案：创建临时textarea选中文本后执行复制命令
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0'; // 隐藏但仍在DOM中，避免页面跳动
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    alert('已复制到剪贴板！可以直接粘贴到Excel中。');
  } catch (err) {
    console.error('复制失败:', err);
    alert('复制失败，请手动复制数据。');
  }
};

// ===== 挂绳PVC卡：12种吊绳颜色（别名 -> 中文显示名），显示顺序即用户定义顺序 =====
// 别名兼容中英文各种写法；"蓝灰/蓝黑/blue gray" 等统一显示为"浅蓝色"
const LANYARD_COLORS = [
  { aliases: ['orange', '橘色'], cn: '橘色' },
  { aliases: ['gray', 'grey', '灰色'], cn: '灰色' },
  { aliases: ['white', '白色'], cn: '白色' },
  { aliases: ['pink', '粉色'], cn: '粉色' },
  { aliases: ['purple', '紫色'], cn: '紫色' },
  { aliases: ['red', '红色'], cn: '红色' },
  { aliases: ['green', '绿色'], cn: '绿色' },
  { aliases: ['blue gray', 'blue grey', 'bluegray', 'bluegrey', 'blue-gray', '蓝灰', '蓝黑', '浅蓝'], cn: '浅蓝色' },
  { aliases: ['royal blue', '蓝色'], cn: '蓝色' },
  { aliases: ['gold', '金色'], cn: '金色' },
  { aliases: ['yellow', '黄色'], cn: '黄色' },
  { aliases: ['black', '黑色'], cn: '黑色' },
];
// 识别池：别名从长到短匹配；长度相同时"浅蓝色"的别名优先，
// 避免 "浅蓝色" 被误判成 "蓝色"、"蓝灰色" 被误判成 "灰色"
const LANYARD_DETECT_POOL = [];
LANYARD_COLORS.forEach(({ aliases, cn }) => {
  aliases.forEach((a) =>
    LANYARD_DETECT_POOL.push({ a: a.toLowerCase(), cn, priority: cn === '浅蓝色' ? 1 : 0 }),
  );
});
LANYARD_DETECT_POOL.sort((x, y) => y.a.length - x.a.length || y.priority - x.priority);

// 从商品属性集中识别吊绳颜色，识别不到返回 null
const detectLanyardColor = (attributes) => {
  const lower = (attributes || '').toLowerCase();
  for (const { a, cn } of LANYARD_DETECT_POOL) {
    if (lower.includes(a)) return cn;
  }
  return null;
};

// 识别"颜色-pcs"证卡格式（如 "紫色-48pcs"、"黑色 48个"、"blue gray-48pcs"）：
// 商品属性集中某颜色后紧跟数量（分隔符可为 -、空格、:、/ 或无分隔符），
// 且整行（属性集/名称/SKU）不含 cm/mm 规格（避免把徽章误判成证卡）
const detectCardFormat = (attributes, productName, skuCode) => {
  const lower = (attributes || '').toLowerCase();
  if (/(\d+(\.\d+)?)\s*(cm|mm)/i.test(`${lower} ${productName || ''} ${skuCode || ''}`)) {
    return false;
  }
  for (const { a } of LANYARD_DETECT_POOL) {
    const escaped = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`${escaped}[\\s\\-–—－:：/,，;；.。]*\\d+\\s*(pcs|个)`, 'i');
    if (re.test(lower)) return true;
  }
  return false;
};

// 提取PCS数量：优先级 商品属性集 > 商品名称 > SKU货号
const extractPcs = (attributes, productName, skuCode) => {
  const pcsInAttrMatch = attributes.match(/(\d+)\s*(pcs|个)/i);
  if (pcsInAttrMatch) return parseInt(pcsInAttrMatch[1], 10);
  const pcsInNameMatch = productName.match(/(\d+)\s*(pcs|个)/i);
  if (pcsInNameMatch) return parseInt(pcsInNameMatch[1], 10);
  const pcsInSkuMatch = skuCode.match(/(\d+)\s*(pcs|个)/i);
  if (pcsInSkuMatch) return parseInt(pcsInSkuMatch[1], 10);
  return 0;
};

const processData = (data) => {
  const specMap = new Map();
  const lanyardMap = new Map(); // 吊绳颜色(中文) -> 数量
  let pvcTotal = 0; // PVC卡总数 = 吊绳总数

  data.forEach(row => {
    const productName = row['商品名称'] || '';
    const attributes = row['商品属性集'] || '';
    const orderInfo = row['备货单'] || '';
    const skuCode = row['SKU货号'] || ''; // 读取SKU货号字段

    // 跳过完全空白的续行（如"定制区域二"的图片行）
    if (!productName && !attributes && !orderInfo) {
      return;
    }

    // 获取计件数（吊绳PVC卡与普通规格共用）
    const multiplierMatch = orderInfo.match(/[,，\s](\d+)\s*件/);
    const multiplier = multiplierMatch ? parseInt(multiplierMatch[1], 10) : 0;

    // ===== 挂绳PVC卡品类 =====
    // 判定条件：商品名称包含 Lanyard，或商品属性集为"颜色-pcs"证卡格式
    // （如 "紫色-48pcs"，即使名称不含 Lanyard 也按证卡统计）
    if (/lanyard/i.test(productName) || detectCardFormat(attributes, productName, skuCode)) {
      const colorCn = detectLanyardColor(attributes);
      const basePcs = extractPcs(attributes, productName, skuCode);

      if (!colorCn || basePcs === 0 || multiplier === 0) {
        const reason = [];
        if (!colorCn) reason.push('无法识别吊绳颜色; ');
        if (basePcs === 0) reason.push('无法提取PCS; ');
        if (multiplier === 0) reason.push('无法提取计件数; ');
        skippedRows.value.push({ ...row, reason: reason.join('').trim() });
        return;
      }

      const total = basePcs * multiplier;
      // 合并同类项：同颜色吊绳数量相加
      lanyardMap.set(colorCn, (lanyardMap.get(colorCn) || 0) + total);
      // 每根吊绳配1张PVC卡，PVC卡单独统计（不与吊绳合并）
      pvcTotal += total;
      return;
    }

    let basePcs = 0;
    let spec = 'N/A';

    // 数据源优先级：商品属性集 > 商品名称 > SKU货号（兜底）

    // 尝试从商品属性集匹配 "规格-数量" 组合格式，如 "44mm-30pcs", "44mm / 30pcs"
    const multiSpecMatch = attributes.match(/((\d+(\.\d+)?)(cm|mm))\D+(\d+)\s*(pcs|个)/i);

    if (multiSpecMatch) {
      // Case 1: 商品属性集包含完整的规格和数量信息
      let value = parseFloat(multiSpecMatch[2]);
      const unit = multiSpecMatch[4];
      if (unit === 'cm') {
        value *= 10; // 转换cm为mm
      }
      spec = `${value}mm`;
      basePcs = parseInt(multiSpecMatch[5], 10);
    } else {
      // Case 2: 分别解析规格和数量

      // 1. 解析规格：优先级 商品属性集 > 商品名称 > SKU货号
      const specRegex = /(\d+(\.\d+)?)\s*(cm|mm)/i;
      const specMatchInAttr = attributes.match(specRegex);
      const specMatchInName = productName.match(specRegex);
      const specMatchInSku = skuCode.match(specRegex);

      if (specMatchInAttr) {
        let value = parseFloat(specMatchInAttr[1]);
        const unit = specMatchInAttr[3].toLowerCase();
        if (unit === 'cm') {
          value *= 10;
        }
        spec = `${Math.round(value)}mm`;
      } else if (specMatchInName) {
        let value = parseFloat(specMatchInName[1]);
        const unit = specMatchInName[3].toLowerCase();
        if (unit === 'cm') {
          value *= 10;
        }
        spec = `${Math.round(value)}mm`;
      } else if (specMatchInSku) {
        // 兜底：从SKU货号提取规格
        let value = parseFloat(specMatchInSku[1]);
        const unit = specMatchInSku[3].toLowerCase();
        if (unit === 'cm') {
          value *= 10;
        }
        spec = `${Math.round(value)}mm`;
      }

      // 2. 解析PCS数量：优先级 商品属性集 > 商品名称 > SKU货号
      basePcs = extractPcs(attributes, productName, skuCode);

      // 3. 如果规格仍未找到，且商品属性集不是纯PCS值，则使用商品属性集作为规格
      if (spec === 'N/A' && attributes && !/^\s*\d+\s*(pcs|个)\s*$/i.test(attributes)) {
        spec = attributes;
      }
    }

    // 检查SKU货号是否包含plastic，如果包含则在规格前加"塑料"前缀
    const isPlastic = /plastic/i.test(skuCode);
    if (isPlastic && spec !== 'N/A') {
      spec = `塑料${spec}`;
    }

    // Calculate and aggregate
    if (basePcs > 0 && multiplier > 0 && spec !== 'N/A') {
      const total = basePcs * multiplier;
      if (specMap.has(spec)) {
        specMap.set(spec, specMap.get(spec) + total);
      } else {
        specMap.set(spec, total);
      }
    } else {
      let reason = '';
      if (basePcs === 0) reason += '无法提取PCS; ';
      if (multiplier === 0) reason += '无法提取计件数; ';
      if (spec === 'N/A') reason += '无法提取规格; ';
      skippedRows.value.push({ ...row, reason: reason.trim() });
    }
  });

  if (specMap.size === 0 && lanyardMap.size === 0 && pvcTotal === 0 && skippedRows.value.length === 0) {
    error.value = "未在文件中找到有效数据或数据格式不匹配。请检查列名和内容。";
    return;
  }

  // 组装统计结果：吊绳颜色（按12色顺序）-> PVC卡 -> 普通规格（按数值排序）
  const stats = [];
  LANYARD_COLORS.forEach(({ cn }) => {
    if (lanyardMap.has(cn)) {
      stats.push({ spec: `${cn}吊绳`, total: lanyardMap.get(cn) });
    }
  });
  if (pvcTotal > 0) {
    stats.push({ spec: 'PVC卡', total: pvcTotal });
  }
  const regularStats = Array.from(specMap.entries())
    .map(([spec, total]) => ({ spec, total }))
    .sort((a, b) => {
        const sizeA = parseFloat(a.spec);
        const sizeB = parseFloat(b.spec);
        return sizeA - sizeB;
    });
  stats.push(...regularStats);

  // 分类合计：吊绳套装（= PVC卡数量） + 徽章（普通/塑料分开合计）
  const badgeRegular = Array.from(specMap.entries())
    .filter(([spec]) => !spec.startsWith('塑料'))
    .reduce((sum, [, total]) => sum + total, 0);
  const badgePlastic = Array.from(specMap.entries())
    .filter(([spec]) => spec.startsWith('塑料'))
    .reduce((sum, [, total]) => sum + total, 0);
  const badgeTotal = badgeRegular + badgePlastic;

  const totals = [];
  if (pvcTotal > 0) {
    totals.push({ label: '吊绳套装合计', value: pvcTotal });
  }
  if (badgeTotal > 0) {
    totals.push({ label: '徽章合计', value: badgeTotal });
    totals.push({ label: '普通徽章', value: badgeRegular, sub: true });
    totals.push({ label: '塑料徽章', value: badgePlastic, sub: true });
  }
  totalRows.value = totals;
  totalSum.value = pvcTotal + badgeTotal;
  statistics.value = stats;
};
</script>