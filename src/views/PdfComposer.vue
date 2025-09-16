<template>
  <div class="p-4 md:p-8 space-y-6">
    <h1 class="text-2xl font-bold">PDF 合成工具</h1>

    <!-- Step 1: Upload Template -->
    <div class="p-4 border rounded-lg bg-white shadow-sm">
      <h2 class="text-lg font-semibold mb-2">1. 上传 PDF 模板</h2>
      <input type="file" @change="handleTemplateUpload" accept=".pdf" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
    </div>

    <!-- Step 2: Preview and Select Area -->
    <div v-show="isTemplateRendered" class="p-4 border rounded-lg bg-white shadow-sm">
        <h2 class="text-lg font-semibold mb-2">2. 在模板上选择条码位置</h2>
        <p class="text-sm text-gray-500 mb-2">请用鼠标在下方预览图上拖拽出一个矩形区域。</p>
        <div class="pdf-preview-container bg-gray-100 shadow-inner rounded" style="display: grid; place-items: center;">
            <canvas ref="templateCanvas" style="grid-column: 1; grid-row: 1; z-index: 1;"></canvas>
            <canvas 
                ref="selectionCanvas"
                style="grid-column: 1; grid-row: 1; z-index: 2;"
                class="cursor-crosshair"
                @mousedown="onMouseDown"
                @mousemove="onMouseMove"
                @mouseup="onMouseUp"
                @mouseleave="onMouseUp"
            ></canvas>
        </div>
        <div v-if="selectionRect.width" class="mt-2 text-sm text-center text-gray-600">
            已选择区域: (x: {{ selectionRect.x.toFixed(0) }}, y: {{ selectionRect.y.toFixed(0) }}) - (宽: {{ selectionRect.width.toFixed(0) }}, 高: {{ selectionRect.height.toFixed(0) }})
        </div>
    </div>

    <!-- Step 3: Upload Barcode -->
    <div v-if="selectionRect.width" class="p-4 border rounded-lg bg-white shadow-sm">
        <h2 class="text-lg font-semibold mb-2">3. 上传条码 PDF</h2>
        <input type="file" @change="handleBarcodeUpload" accept=".pdf" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
    </div>

    <!-- Step 4: Compose and Download -->
    <div v-if="barcodeImage.src" class="p-4 border rounded-lg bg-white shadow-sm text-center">
        <h2 class="text-lg font-semibold mb-4">4. 合成并下载</h2>
        <p class="text-sm text-gray-500 mb-4">所有材料准备就绪！</p>
        <button @click="composeAndDownload" class="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-base font-bold shadow-lg" :disabled="isComposing">
            {{ isComposing ? '正在合成中...' : '合成并下载 PDF' }}
        </button>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const templateCanvas = ref(null);
const selectionCanvas = ref(null);
const isTemplateRendered = ref(false);
const pdfPage = ref(null);
const templateFile = ref(null);

const isDrawing = ref(false);
const startPos = reactive({ x: 0, y: 0 });
const selectionRect = reactive({ x: 0, y: 0, width: 0, height: 0 });

const barcodeImage = reactive({ src: null });
const barcodeFilename = ref('');
const isComposing = ref(false);

const handleTemplateUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  templateFile.value = file;
  selectionRect.width = 0;
  barcodeImage.src = null;

  try {
    const pdfjsLib = await window.pdfjsLibPromise;
    if (!pdfjsLib) { alert('PDF.js 库未能成功加载'); return; }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    pdfPage.value = page;

    const viewport = page.getViewport({ scale: 1.5 });
    
    const canvas = templateCanvas.value;
    const selCanvas = selectionCanvas.value;
    const context = canvas.getContext('2d');

    canvas.height = viewport.height;
    canvas.width = viewport.width;
    selCanvas.height = viewport.height;
    selCanvas.width = viewport.width;

    canvas.style.width = viewport.width + 'px';
    canvas.style.height = viewport.height + 'px';
    selCanvas.style.width = viewport.width + 'px';
    selCanvas.style.height = viewport.height + 'px';

    await page.render({ canvasContext: context, viewport: viewport }).promise;
    isTemplateRendered.value = true;

  } catch (error) {
    console.error('Error rendering PDF:', error);
    alert(`渲染PDF时出错: ${error.message}`);
  }
};

const onMouseDown = (e) => {
    if (!isTemplateRendered.value) return;
    isDrawing.value = true;
    startPos.x = e.offsetX;
    startPos.y = e.offsetY;
    selectionRect.x = e.offsetX;
    selectionRect.y = e.offsetY;
    selectionRect.width = 0;
    selectionRect.height = 0;
};

const onMouseMove = (e) => {
    if (!isDrawing.value) return;

    const canvas = selectionCanvas.value;
    const context = canvas.getContext('2d');
    const currentX = e.offsetX;
    const currentY = e.offsetY;

    const width = currentX - startPos.x;
    const height = currentY - startPos.y;

    context.clearRect(0, 0, canvas.width, canvas.height);
    
    context.beginPath();

    context.fillStyle = 'rgba(255, 0, 0, 0.2)';
    context.fillRect(startPos.x, startPos.y, width, height);

    context.strokeStyle = 'red';
    context.lineWidth = 2;
    context.strokeRect(startPos.x, startPos.y, width, height);

    selectionRect.x = startPos.x;
    selectionRect.y = startPos.y;
    selectionRect.width = width;
    selectionRect.height = height;
};

const onMouseUp = () => {
    isDrawing.value = false;
};

const handleBarcodeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    barcodeFilename.value = file.name;

    try {
        const pdfjsLib = await window.pdfjsLibPromise;
        if (!pdfjsLib) { alert('PDF.js 库尚未加载完成'); return; }

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.height = viewport.height;
        tempCanvas.width = viewport.width;

        await page.render({ canvasContext: tempCtx, viewport: viewport }).promise;
        barcodeImage.src = tempCanvas.toDataURL('image/png');

    } catch (error) {
        console.error('Error rendering barcode PDF:', error);
        alert(`渲染条码PDF时出错: ${error.message}`);
    }
};

const composeAndDownload = async () => {
    if (!templateFile.value || !barcodeImage.src || !selectionRect.width) {
        alert('请先完成所有步骤！');
        return;
    }
    isComposing.value = true;

    try {
        const { PDFDocument } = window.PDFLib;
        if (!PDFDocument) { alert('pdf-lib 库未能成功加载！'); isComposing.value = false; return; }
        
        const templateBytes = await templateFile.value.arrayBuffer();
        const pdfDoc = await PDFDocument.load(templateBytes);
        const page = pdfDoc.getPages()[0];

        const barcodeBytes = barcodeImage.src;
        const barcodeImageEmbed = await pdfDoc.embedPng(barcodeBytes);

        const pdfRenderedPage = await (await window.pdfjsLib.getDocument({data: templateBytes}).promise).getPage(1);
        const viewport = pdfRenderedPage.getViewport({ scale: 1.5 });
        const pageHeight = page.getHeight();
        const scale = page.getHeight() / viewport.height;

        const pdfX = selectionRect.x * scale;
        const pdfY = pageHeight - (selectionRect.y * scale) - (selectionRect.height * scale);
        const pdfWidth = selectionRect.width * scale;
        const pdfHeight = selectionRect.height * scale;

        page.drawImage(barcodeImageEmbed, {
            x: pdfX,
            y: pdfY,
            width: pdfWidth,
            height: pdfHeight,
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        
        const baseName = barcodeFilename.value.replace(/\.pdf$/i, '');
        link.download = `${baseName}_result.pdf`;

        link.click();
        URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error('Error composing PDF:', error);
        alert(`合成PDF时出错: ${error.message}`);
    } finally {
        isComposing.value = false;
    }
};

</script>

<style scoped>
.pdf-preview-container {
    max-height: 80vh;
    overflow: auto;
}
</style>
