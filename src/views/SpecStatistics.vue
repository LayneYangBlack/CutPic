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
          <h2 class="text-xl font-semibold mb-3">统计结果</h2>
          <div class="mb-3 text-lg font-bold text-gray-800">
            <span>总计: </span>
            <span class="text-blue-600">{{ totalSum }}</span>
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

const processData = (data) => {
  const specMap = new Map();

  data.forEach(row => {
    const productName = row['商品名称'] || '';
    const attributes = row['商品属性集'] || '';
    const orderInfo = row['备货单'] || '';

    let basePcs = 0;
    let spec = 'N/A';

    // New Logic: Prioritize parsing attributes first
    // Try to match `(spec) non-digit-separator (pcs)` format, e.g., "44mm-30pcs", "44mm / 30pcs"
    const multiSpecMatch = attributes.match(/((\d+(\.\d+)?)(cm|mm))\D+(\d+)\s*pcs/i);

    if (multiSpecMatch) {
      // Case 1: Multi-spec name, attributes contain both spec and pcs
      let value = parseFloat(multiSpecMatch[2]);
      const unit = multiSpecMatch[4];
      if (unit === 'cm') {
        value *= 10; // Convert cm to mm
      }
      spec = `${value}mm`;
      basePcs = parseInt(multiSpecMatch[5], 10);
    } else {
      // Case 2: Single-spec name, parse spec and pcs separately
      
      // 1. Find Spec: Check attributes first, then fall back to name
      const specRegex = /(\d+(\.\d+)?)\s*(cm|mm)/i;
      const specMatchInAttr = attributes.match(specRegex);
      const specMatchInName = productName.match(specRegex);

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
      }

      // 2. Find PCS, check attributes first, then name
      const pcsInAttrMatch = attributes.match(/(\d+)\s*pcs/i);
      if (pcsInAttrMatch) {
        basePcs = parseInt(pcsInAttrMatch[1], 10);
      } else {
        const pcsInNameMatch = productName.match(/(\d+)\s*pcs/i);
        if (pcsInNameMatch) {
          basePcs = parseInt(pcsInNameMatch[1], 10);
        }
      }

      // 3. Fallback for spec if it wasn't found and attribute is not a PCS value
      if (spec === 'N/A' && attributes && !/^\s*\d+\s*pcs\s*$/i.test(attributes)) {
        spec = attributes;
      }
    }

    // Get Multiplier (now allows space or comma as separator)
    const multiplierMatch = orderInfo.match(/[,，\s](\d+)\s*件/);
    const multiplier = multiplierMatch ? parseInt(multiplierMatch[1], 10) : 0;

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

  if (specMap.size === 0 && skippedRows.value.length === 0) {
    error.value = "未在文件中找到有效数据或数据格式不匹配。请检查列名和内容。";
    return;
  }

  totalSum.value = Array.from(specMap.values()).reduce((sum, count) => sum + count, 0);

  statistics.value = Array.from(specMap.entries())
    .map(([spec, total]) => ({ spec, total }))
    .sort((a, b) => {
        const sizeA = parseFloat(a.spec);
        const sizeB = parseFloat(b.spec);
        return sizeA - sizeB;
    });
};
</script>
