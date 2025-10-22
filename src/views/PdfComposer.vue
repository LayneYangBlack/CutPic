<template>
  <div class="p-4 md:p-8 space-y-6">
    <h1 class="text-2xl font-bold">PDF 合成工具 (支持批量)</h1>

    <!-- Step 1: Upload Template -->
    <div class="p-4 border rounded-lg bg-white shadow-sm">
      <h2 class="text-lg font-semibold mb-2">1. 上传或加载 PDF 模板</h2>
      <input type="file" @change="handleTemplateUpload" accept=".pdf" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
      
      <div class="mt-4">
        <p class="text-center text-sm text-gray-500">或者</p>
        <div class="flex items-center gap-2 mt-2">
          <input type="text" v-model="templateUrl" placeholder="输入PDF网络地址..." class="flex-grow block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
          <button @click="handleTemplateUrl" class="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 whitespace-nowrap" :disabled="isLoadingTemplate">
            <span v-if="isLoadingTemplate">加载中...</span>
            <span v-else>加载URL</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Step 2: Preview and Select Area -->
    <div v-show="isTemplateRendered" class="p-4 border rounded-lg bg-white shadow-sm">
        <h2 class="text-lg font-semibold mb-2">2. 在模板上选择条码位置</h2>
        <p class="text-sm text-gray-500 mb-2">请用鼠标在下方预览图上拖拽出一个矩形区域，可拖动和缩放。</p>
        <div class="pdf-preview-container bg-gray-100 shadow-inner rounded" style="display: grid; place-items: center;">
            <canvas ref="templateCanvas" style="grid-column: 1; grid-row: 1; z-index: 1;"></canvas>
            <canvas 
                ref="selectionCanvas"
                style="grid-column: 1; grid-row: 1; z-index: 2; cursor: crosshair;"
                @mousedown="onMouseDown"
                @mousemove="onMouseMove"
                @mouseup="onMouseUp"
                @mouseleave="onMouseUp"
            ></canvas>
        </div>
        <div v-if="selectionRect.width > 0" class="mt-2 text-sm text-center text-gray-600">
            已选择区域: (x: {{ selectionRect.x.toFixed(0) }}, y: {{ selectionRect.y.toFixed(0) }}) - (宽: {{ selectionRect.width.toFixed(0) }}, 高: {{ selectionRect.height.toFixed(0) }})
        </div>
    </div>

    <!-- Step 3: Upload Barcode -->
    <div v-if="selectionRect.width > 0" class="p-4 border rounded-lg bg-white shadow-sm">
        <h2 class="text-lg font-semibold mb-2">3. 上传条码文件 (可多选)</h2>
        <input type="file" @change="handleBarcodeUpload" accept=".pdf,image/*" multiple class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
        <div v-if="barcodeFiles.length" class="mt-4">
            <h3 class="text-md font-semibold">已选择文件 ({{ barcodeFiles.length }}):</h3>
            <ul class="list-disc list-inside max-h-40 overflow-y-auto mt-2 text-sm text-gray-600">
                <li v-for="(file, index) in barcodeFiles" :key="index">{{ file.name }}</li>
            </ul>
        </div>
    </div>

    <!-- Step 4: Compose -->
    <div v-if="barcodeFiles.length > 0" class="p-4 border rounded-lg bg-white shadow-sm text-center">
        <h2 class="text-lg font-semibold mb-4">4. 开始合成</h2>
        
        <div class="max-w-md mx-auto">
            <label for="custom-filename" class="block text-sm font-medium text-gray-700">自定义文件名前缀 (可选)</label>
            <input type="text" id="custom-filename" v-model.trim="customFilename" placeholder="单文件模式下为完整文件名(不带后缀)" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900">
        </div>

        <div class="mt-4 flex justify-center items-center gap-4">
            <button @click="startComposition" class="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-base font-bold shadow-lg" :disabled="isComposing" v-if="barcodeFiles.length === 1">
                <span v-if="isComposing">{{ composingProgress }}</span>
                <span v-else>合成并预览</span>
            </button>
            <template v-if="barcodeFiles.length > 1">
                <button @click="composeBatchZip" class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-base font-bold shadow-lg" :disabled="isComposing">
                    <span v-if="isComposing">{{ composingProgress }}</span>
                    <span v-else>批量合成并下载 ZIP</span>
                </button>
                <button @click="composeBatchPdf" class="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-base font-bold shadow-lg" :disabled="isComposing">
                    <span v-if="isComposing">{{ composingProgress }}</span>
                    <span v-else>批量合成并预览</span>
                </button>
            </template>
        </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="showPreviewModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-2xl w-11/12 md:w-3/4 lg:w-1/2 max-h-[90vh] flex flex-col">
        <div class="flex justify-between items-center p-4 border-b">
          <h2 class="text-xl font-bold">预览与操作</h2>
          <button @click="closePreview" class="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
        </div>
        <div class="p-4 flex-grow overflow-y-auto">
          <iframe :src="previewPdfUrl" ref="previewIframe" class="w-full h-[60vh] border-none"></iframe>
        </div>
        <div class="flex justify-end items-center p-4 border-t gap-4">
          <button @click="printPdf" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">打印</button>
          <button @click="downloadPdf" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">下载</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted, watch } from 'vue';

// --- State ---
const templateCanvas = ref(null);
const selectionCanvas = ref(null);
const isTemplateRendered = ref(false);
const templateFile = ref(null);
const templateUrl = ref('');
const isLoadingTemplate = ref(false);

const selectionRect = reactive({ x: 0, y: 0, width: 0, height: 0, visible: false });
const interaction = reactive({ mode: 'none', activeHandle: null, startPos: { x: 0, y: 0 }, startRect: {} });
const HANDLE_SIZE = 8;

const barcodeFiles = ref([]);
const customFilename = ref('');
const isComposing = ref(false);
const composingProgress = ref('');

const showPreviewModal = ref(false);
const previewPdfUrl = ref('');
const previewIframe = ref(null);

// --- Watchers ---
watch(selectionRect, redrawSelectionCanvas, { deep: true });

// --- Interactive Selection Box Logic (unchanged) ---
function redrawSelectionCanvas() {
  const canvas = selectionCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!selectionRect.visible || selectionRect.width === 0) return;
  const { x, y, width, height } = selectionRect;
  ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = 'red';
  const handles = getHandles(selectionRect);
  for (const key in handles) {
    const handle = handles[key];
    ctx.fillRect(handle.x - HANDLE_SIZE / 2, handle.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  }
}
function getHandles(rect) {
  if (!rect.visible) return {};
  const { x, y, width, height } = rect;
  return { topLeft: { x, y }, top: { x: x + width / 2, y }, topRight: { x: x + width, y }, left: { x, y: y + height / 2 }, right: { x: x + width, y: y + height / 2 }, bottomLeft: { x, y: y + height }, bottom: { x: x + width / 2, y: y + height }, bottomRight: { x: x + width, y: y + height } };
}
function getHandleAtPos(posX, posY) {
  const handles = getHandles(selectionRect);
  for (const key in handles) {
    const handle = handles[key];
    if (posX >= handle.x - HANDLE_SIZE / 2 && posX <= handle.x + HANDLE_SIZE / 2 && posY >= handle.y - HANDLE_SIZE / 2 && posY <= handle.y + HANDLE_SIZE / 2) return key;
  }
  return null;
}
function isPointInRect(posX, posY, rect) {
  return rect.visible && posX >= rect.x && posX <= rect.x + rect.width && posY >= rect.y && posY <= rect.y + rect.height;
}
function getCursorStyle(handle) {
  if (['topLeft', 'bottomRight'].includes(handle)) return 'nwse-resize';
  if (['topRight', 'bottomLeft'].includes(handle)) return 'nesw-resize';
  if (['top', 'bottom'].includes(handle)) return 'ns-resize';
  if (['left', 'right'].includes(handle)) return 'ew-resize';
  return 'move';
}
const onMouseDown = (e) => {
  const { offsetX, offsetY } = e;
  interaction.startPos = { x: offsetX, y: offsetY };
  interaction.startRect = JSON.parse(JSON.stringify(selectionRect));
  const handle = getHandleAtPos(offsetX, offsetY);
  if (handle) {
    interaction.mode = 'resizing';
    interaction.activeHandle = handle;
  } else if (isPointInRect(offsetX, offsetY, selectionRect)) {
    interaction.mode = 'moving';
  } else {
    interaction.mode = 'drawing';
    selectionRect.x = offsetX;
    selectionRect.y = offsetY;
    selectionRect.width = 0;
    selectionRect.height = 0;
    selectionRect.visible = true;
  }
};
const onMouseMove = (e) => {
  const { offsetX, offsetY } = e;
  if (interaction.mode === 'none') {
    const handle = getHandleAtPos(offsetX, offsetY);
    selectionCanvas.value.style.cursor = handle ? getCursorStyle(handle) : isPointInRect(offsetX, offsetY, selectionRect) ? 'move' : 'crosshair';
    return;
  }
  const dx = offsetX - interaction.startPos.x;
  const dy = offsetY - interaction.startPos.y;
  if (interaction.mode === 'drawing') {
    selectionRect.width = dx;
    selectionRect.height = dy;
  } else if (interaction.mode === 'moving') {
    selectionRect.x = interaction.startRect.x + dx;
    selectionRect.y = interaction.startRect.y + dy;
  } else if (interaction.mode === 'resizing') {
    const { x, y, width, height } = interaction.startRect;
    switch (interaction.activeHandle) {
      case 'topLeft': selectionRect.x = x + dx; selectionRect.y = y + dy; selectionRect.width = width - dx; selectionRect.height = height - dy; break;
      case 'top': selectionRect.y = y + dy; selectionRect.height = height - dy; break;
      case 'topRight': selectionRect.y = y + dy; selectionRect.width = width + dx; selectionRect.height = height - dy; break;
      case 'left': selectionRect.x = x + dx; selectionRect.width = width - dx; break;
      case 'right': selectionRect.width = width + dx; break;
      case 'bottomLeft': selectionRect.x = x + dx; selectionRect.width = width - dx; selectionRect.height = height + dy; break;
      case 'bottom': selectionRect.height = height + dy; break;
      case 'bottomRight': selectionRect.width = width + dx; selectionRect.height = height + dy; break;
    }
  }
};
const onMouseUp = () => {
  if (interaction.mode === 'drawing' || interaction.mode === 'resizing') {
    if (selectionRect.width < 0) { selectionRect.x += selectionRect.width; selectionRect.width *= -1; }
    if (selectionRect.height < 0) { selectionRect.y += selectionRect.height; selectionRect.height *= -1; }
  }
  interaction.mode = 'none';
  interaction.activeHandle = null;
};

// --- PDF Template Handling ---
const processTemplateFile = async (file) => {
  if (!file) return;
  templateFile.value = file;
  selectionRect.visible = false;
  selectionRect.width = 0;
  barcodeFiles.value = [];
  try {
    const pdfjsLib = await window.pdfjsLibPromise;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = templateCanvas.value;
    const selCanvas = selectionCanvas.value;
    [canvas, selCanvas].forEach(c => { c.height = viewport.height; c.width = viewport.width; c.style.width = `${viewport.width}px`; c.style.height = `${viewport.height}px`; });
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
    isTemplateRendered.value = true;
    selectionRect.x = 18;
    selectionRect.y = 487;
    selectionRect.width = 448;
    selectionRect.height = 105;
    selectionRect.visible = true;
  } catch (error) {
    console.error('渲染PDF模板时出错:', error);
    alert(`渲染PDF模板时出错: ${error.message}`);
  }
};

const handleTemplateUpload = async (event) => {
  const file = event.target.files[0];
  await processTemplateFile(file);
};

const handleTemplateUrl = async () => {
  if (!templateUrl.value) {
    alert('请输入PDF的URL');
    return;
  }
  isLoadingTemplate.value = true;
  try {
    const response = await fetch(templateUrl.value);
    if (!response.ok) {
      throw new Error(`网络响应错误: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    if (blob.type !== 'application/pdf') {
        alert('URL指向的不是一个PDF文件，或者服务器未正确设置Content-Type。');
        isLoadingTemplate.value = false;
        return;
    }
    const fileName = templateUrl.value.split('/').pop().split('#')[0].split('?')[0] || 'downloaded.pdf';
    const file = new File([blob], fileName, { type: 'application/pdf' });
    await processTemplateFile(file);
  } catch (error) {
    console.error('加载网络PDF时出错:', error);
    alert(`加载网络PDF失败: ${error.message}。请检查URL是否正确，以及是否存在CORS跨域限制。`);
  } finally {
    isLoadingTemplate.value = false;
  }
};

// --- Barcode File Handling ---
const handleBarcodeUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
        barcodeFiles.value = [];
        return;
    }

    isComposing.value = true;
    composingProgress.value = '正在处理上传文件...';
    const newBarcodeSources = [];

    try {
        const pdfjsLib = await window.pdfjsLibPromise;
        for (const file of files) {
            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                // If it's a multi-page PDF, treat each page as a source
                if (pdf.numPages > 1) {
                    for (let i = 1; i <= pdf.numPages; i++) {
                        newBarcodeSources.push({ file, page: i, name: `${file.name} (第 ${i} 页)` });
                    }
                } else {
                    // Single-page PDF, treat as one source
                    newBarcodeSources.push({ file, page: 1, name: file.name });
                }
            } else if (file.type.startsWith('image/')) {
                newBarcodeSources.push({ file, name: file.name });
            } else {
                console.warn(`Skipping unsupported file type: ${file.name}`);
            }
        }
        barcodeFiles.value = newBarcodeSources;
    } catch (error) {
        console.error('Error processing uploaded files:', error);
        alert(`处理上传文件时出错: ${error.message}`);
        barcodeFiles.value = [];
    } finally {
        isComposing.value = false;
        composingProgress.value = '';
    }
};

// --- Helper Functions ---
const getFormattedTimestamp = () => {
  const now = new Date();
  const YYYY = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `_${YYYY}${MM}${DD}_${hh}${mm}${ss}`;
};

const getBarcodeAsPngBytes = async (barcodeSource) => {
    const { file, page: pageNum } = barcodeSource;
    if (file.type === 'application/pdf') {
        const pdfjsLib = await window.pdfjsLibPromise;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(pageNum || 1);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
        return await new Promise(resolve => canvas.toBlob(blob => blob.arrayBuffer().then(resolve), 'image/png'));
    } else if (file.type.startsWith('image/')) {
        return await file.arrayBuffer();
    }
    return null;
};

// --- Composition Logic ---
const startComposition = async () => {
    if (!templateFile.value || !barcodeFiles.value.length || !selectionRect.width) { alert('请先完成所有步骤！'); return; }
    if (barcodeFiles.value.length === 1) await composeSinglePdf();
    // For multiple files, buttons call composeBatchZip or composeBatchPdf directly
};

async function createPdfPage(pdfDoc, barcodeSource) {
    const barcodeBytes = await getBarcodeAsPngBytes(barcodeSource);
    if (!barcodeBytes) throw new Error(`不支持的文件类型: ${barcodeSource.name}`);
    
    const barcodeImageEmbed = await pdfDoc.embedPng(barcodeBytes);
    const templatePage = pdfDoc.getPages()[0];
    const { width, height } = templatePage.getSize();
    const viewport = await window.pdfjsLib.getDocument(await templateFile.value.arrayBuffer()).promise.then(pdf => pdf.getPage(1)).then(p => p.getViewport({ scale: 1.5 }));
    const scale = height / viewport.height;
    const pdfX = selectionRect.x * scale, pdfY = height - (selectionRect.y * scale) - (selectionRect.height * scale), pdfWidth = selectionRect.width * scale, pdfHeight = selectionRect.height * scale;
    templatePage.drawImage(barcodeImageEmbed, { x: pdfX, y: pdfY, width: pdfWidth, height: pdfHeight });
}

const composeSinglePdf = async () => {
    isComposing.value = true;
    composingProgress.value = '正在合成PDF...';
    try {
        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.load(await templateFile.value.arrayBuffer());
        await createPdfPage(pdfDoc, barcodeFiles.value[0]);
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        if (previewPdfUrl.value) URL.revokeObjectURL(previewPdfUrl.value);
        previewPdfUrl.value = URL.createObjectURL(blob);
        showPreviewModal.value = true;
    } catch (error) { console.error('Error composing single PDF:', error); alert(`合成PDF时出错: ${error.message}`);
    } finally { isComposing.value = false; composingProgress.value = ''; }
};

const composeBatchZip = async () => {
    if (!templateFile.value || !barcodeFiles.value.length || !selectionRect.width) { alert('请先完成所有步骤！'); return; }
    isComposing.value = true;
    try {
        const { PDFDocument } = window.PDFLib;
        const zip = new window.JSZip();
        const templateBytes = await templateFile.value.arrayBuffer();
        for (let i = 0; i < barcodeFiles.value.length; i++) {
            const barcodeSource = barcodeFiles.value[i];
            composingProgress.value = `正在合成 ${i + 1} / ${barcodeFiles.value.length}: ${barcodeSource.name}`;
            const pdfDoc = await PDFDocument.load(templateBytes);
            await createPdfPage(pdfDoc, barcodeSource);
            const pdfBytes = await pdfDoc.save();
            const baseName = barcodeSource.name.replace(/\.[^/.]+$/, '');
            zip.file(`${baseName}_result.pdf`, pdfBytes);
        }
        composingProgress.value = '正在生成ZIP文件...';
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        
        if (customFilename.value) {
            link.download = `${customFilename.value}.zip`;
        } else {
            link.download = `合成结果_${getFormattedTimestamp()}.zip`;
        }

        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (error) { console.error('Error composing batch zip:', error); alert(`批量合成时出错: ${error.message}`);
    } finally { isComposing.value = false; composingProgress.value = ''; }
};

const composeBatchPdf = async () => {
    if (!templateFile.value || !barcodeFiles.value.length || !selectionRect.width) { alert('请先完成所有步骤！'); return; }
    isComposing.value = true;
    try {
        const { PDFDocument } = window.PDFLib;
        const finalPdfDoc = await PDFDocument.create();
        const templateBytes = await templateFile.value.arrayBuffer();

        // Get viewport info using a sliced buffer, so templateBytes is not detached.
        const viewport = await window.pdfjsLib.getDocument({ data: templateBytes.slice(0) }).promise.then(pdf => pdf.getPage(1)).then(p => p.getViewport({ scale: 1.5 }));

        for (let i = 0; i < barcodeFiles.value.length; i++) {
            const barcodeSource = barcodeFiles.value[i];
            composingProgress.value = `正在合成 ${i + 1} / ${barcodeFiles.value.length}: ${barcodeSource.name}`;
            
            // Use a sliced buffer for pdf-lib as well to avoid detaching.
            const templatePdfDoc = await PDFDocument.load(templateBytes.slice(0));
            const [templatePage] = await finalPdfDoc.copyPages(templatePdfDoc, [0]);
            finalPdfDoc.addPage(templatePage);

            const barcodeBytes = await getBarcodeAsPngBytes(barcodeSource);
            if (!barcodeBytes) {
                console.warn(`Skipping unsupported file type: ${barcodeSource.name}`);
                continue;
            }
            
            const barcodeImageEmbed = await finalPdfDoc.embedPng(barcodeBytes);
            
            const { width, height } = templatePage.getSize();
            const scale = height / viewport.height;
            const pdfX = selectionRect.x * scale;
            const pdfY = height - (selectionRect.y * scale) - (selectionRect.height * scale);
            const pdfWidth = selectionRect.width * scale;
            const pdfHeight = selectionRect.height * scale;
            
            templatePage.drawImage(barcodeImageEmbed, { x: pdfX, y: pdfY, width: pdfWidth, height: pdfHeight });
        }

        composingProgress.value = '正在生成PDF...';
        const pdfBytes = await finalPdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        if (previewPdfUrl.value) URL.revokeObjectURL(previewPdfUrl.value);
        previewPdfUrl.value = URL.createObjectURL(blob);
        showPreviewModal.value = true;

    } catch (error) { console.error('Error composing batch PDF:', error); alert(`批量合成时出错: ${error.message}`);
    } finally { isComposing.value = false; composingProgress.value = ''; }
};


// --- Modal and Download/Print Logic ---
const closePreview = () => { showPreviewModal.value = false; };
const downloadPdf = () => {
    if (!previewPdfUrl.value) return;
    const link = document.createElement('a');
    link.href = previewPdfUrl.value;

    if (customFilename.value) {
        link.download = `${customFilename.value}.pdf`;
    } else {
        if (barcodeFiles.value.length > 1) {
            link.download = `批量合成结果${getFormattedTimestamp()}.pdf`;
        } else {
            const originalName = barcodeFiles.value[0].name.replace(/\.[^/.]+$/, '');
            link.download = `${originalName}${getFormattedTimestamp()}.pdf`;
        }
    }

    document.body.appendChild(link); link.click(); document.body.removeChild(link);
};
const printPdf = () => {
    if (!previewIframe.value?.contentWindow) return;
    try { previewIframe.value.contentWindow.focus(); previewIframe.value.contentWindow.print();
    } catch (e) { alert('打印功能出错，您的浏览器可能阻止了此操作。'); console.error('Print error:', e); }
};
onUnmounted(() => { if (previewPdfUrl.value) URL.revokeObjectURL(previewPdfUrl.value); });

</script>

<style scoped>
.pdf-preview-container {
    max-height: 80vh;
    overflow: auto;
}
</style>
