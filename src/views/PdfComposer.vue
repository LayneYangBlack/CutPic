<template>
  <div class="p-4 md:p-8 space-y-6">
    <h1 class="text-2xl font-bold">PDF 合成工具 (支持批量)</h1>

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
        <h2 class="text-lg font-semibold mb-2">3. 上传条码文件 (可多选)</h2>
        <input type="file" @change="handleBarcodeUpload" accept=".pdf,image/*" multiple class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
        <div v-if="barcodeFiles.length" class="mt-4">
            <h3 class="text-md font-semibold">已选择文件 ({{ barcodeFiles.length }}):</h3>
            <ul class="list-disc list-inside max-h-40 overflow-y-auto mt-2 text-sm text-gray-600">
                <li v-for="file in barcodeFiles" :key="file.name">{{ file.name }}</li>
            </ul>
        </div>
    </div>

    <!-- Step 4: Compose -->
    <div v-if="barcodeFiles.length > 0" class="p-4 border rounded-lg bg-white shadow-sm text-center">
        <h2 class="text-lg font-semibold mb-4">4. 开始合成</h2>
        <p class="text-sm text-gray-500 mb-4">所有材料准备就绪！</p>
        <button @click="startComposition" class="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-base font-bold shadow-lg" :disabled="isComposing">
            <span v-if="isComposing">{{ composingProgress }}</span>
            <span v-else>{{ barcodeFiles.length > 1 ? '批量合成并下载 ZIP' : '合成并预览' }}</span>
        </button>
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
import { ref, reactive, onUnmounted } from 'vue';

// --- State ---
const templateCanvas = ref(null);
const selectionCanvas = ref(null);
const isTemplateRendered = ref(false);
const pdfPage = ref(null);
const templateFile = ref(null);

const isDrawing = ref(false);
const startPos = reactive({ x: 0, y: 0 });
const selectionRect = reactive({ x: 0, y: 0, width: 0, height: 0 });

const barcodeFiles = ref([]);
const isComposing = ref(false);
const composingProgress = ref('');

const showPreviewModal = ref(false);
const previewPdfUrl = ref('');
const previewIframe = ref(null);

// --- PDF Template Handling ---
const handleTemplateUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  templateFile.value = file;
  selectionRect.width = 0;
  barcodeFiles.value = [];

  try {
    const pdfjsLib = await window.pdfjsLibPromise;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    pdfPage.value = page;

    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = templateCanvas.value;
    const selCanvas = selectionCanvas.value;
    const context = canvas.getContext('2d');

    [canvas, selCanvas].forEach(c => {
        c.height = viewport.height;
        c.width = viewport.width;
        c.style.width = viewport.width + 'px';
        c.style.height = viewport.height + 'px';
    });

    await page.render({ canvasContext: context, viewport: viewport }).promise;
    isTemplateRendered.value = true;
  } catch (error) {
    console.error('Error rendering PDF template:', error);
    alert(`渲染PDF模板时出错: ${error.message}`);
  }
};

// --- Selection Area Drawing ---
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
    const width = e.offsetX - startPos.x;
    const height = e.offsetY - startPos.y;

    context.clearRect(0, 0, canvas.width, canvas.height);
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

// --- Barcode File Handling ---
const handleBarcodeUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) return;
    
    barcodeFiles.value = []; // Reset on new upload
    isComposing.value = true;
    composingProgress.value = '正在处理上传的文件...';

    const processedFiles = [];
    for (const file of files) {
        try {
            let src = null;
            if (file.type === 'application/pdf') {
                const pdfjsLib = await window.pdfjsLibPromise;
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 2.0 });
                const tempCanvas = document.createElement('canvas');
                tempCanvas.height = viewport.height;
                tempCanvas.width = viewport.width;
                await page.render({ canvasContext: tempCanvas.getContext('2d'), viewport: viewport }).promise;
                src = tempCanvas.toDataURL('image/png');
            } else if (file.type.startsWith('image/')) {
                src = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            canvas.getContext('2d').drawImage(img, 0, 0);
                            resolve(canvas.toDataURL('image/png'));
                        };
                        img.onerror = reject;
                        img.src = e.target.result;
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            } else {
                continue; // Skip unsupported files
            }
            processedFiles.push({ name: file.name, src });
        } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            alert(`处理文件 ${file.name} 时出错: ${error.message}`);
        }
    }
    barcodeFiles.value = processedFiles;
    isComposing.value = false;
    composingProgress.value = '';
};

// --- Composition Logic ---
const startComposition = async () => {
    if (!templateFile.value || !barcodeFiles.value.length || !selectionRect.width) {
        alert('请先完成所有步骤！');
        return;
    }

    if (barcodeFiles.value.length === 1) {
        await composeSinglePdf();
    } else {
        await composeBatchZip();
    }
};

const createPdfPage = async (pdfDoc, barcodeSrc) => {
    const barcodeImageEmbed = await pdfDoc.embedPng(barcodeSrc);
    const templatePage = pdfDoc.getPages()[0];
    const { width, height } = templatePage.getSize();

    const viewport = await (await window.pdfjsLib.getDocument(await templateFile.value.arrayBuffer()).promise).getPage(1).then(p => p.getViewport({ scale: 1.5 }));
    const scale = height / viewport.height;

    const pdfX = selectionRect.x * scale;
    const pdfY = height - (selectionRect.y * scale) - (selectionRect.height * scale);
    const pdfWidth = selectionRect.width * scale;
    const pdfHeight = selectionRect.height * scale;

    templatePage.drawImage(barcodeImageEmbed, {
        x: pdfX,
        y: pdfY,
        width: pdfWidth,
        height: pdfHeight,
    });
};

const composeSinglePdf = async () => {
    isComposing.value = true;
    composingProgress.value = '正在合成PDF...';
    try {
        const { PDFDocument } = window.PDFLib;
        const templateBytes = await templateFile.value.arrayBuffer();
        const pdfDoc = await PDFDocument.load(templateBytes);
        
        await createPdfPage(pdfDoc, barcodeFiles.value[0].src);

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        if (previewPdfUrl.value) URL.revokeObjectURL(previewPdfUrl.value);
        previewPdfUrl.value = URL.createObjectURL(blob);
        showPreviewModal.value = true;
    } catch (error) {
        console.error('Error composing single PDF:', error);
        alert(`合成PDF时出错: ${error.message}`);
    } finally {
        isComposing.value = false;
        composingProgress.value = '';
    }
};

const composeBatchZip = async () => {
    isComposing.value = true;
    try {
        const { PDFDocument } = window.PDFLib;
        const zip = new window.JSZip();
        const templateBytes = await templateFile.value.arrayBuffer();

        for (let i = 0; i < barcodeFiles.value.length; i++) {
            const barcode = barcodeFiles.value[i];
            composingProgress.value = `正在合成 ${i + 1} / ${barcodeFiles.value.length}: ${barcode.name}`;
            
            // Load a fresh template for each file
            const pdfDoc = await PDFDocument.load(templateBytes);
            await createPdfPage(pdfDoc, barcode.src);
            const pdfBytes = await pdfDoc.save();

            const baseName = barcode.name.replace(/\.(pdf|png|jpg|jpeg|webp)$/i, '');
            zip.file(`${baseName}_result.pdf`, pdfBytes);
        }

        composingProgress.value = '正在生成ZIP文件...';
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = '合成结果.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error('Error composing batch zip:', error);
        alert(`批量合成时出错: ${error.message}`);
    } finally {
        isComposing.value = false;
        composingProgress.value = '';
    }
};

// --- Modal and Download/Print Logic ---
const closePreview = () => {
    showPreviewModal.value = false;
};

const downloadPdf = () => {
    if (!previewPdfUrl.value) return;
    const link = document.createElement('a');
    link.href = previewPdfUrl.value;
    const baseName = barcodeFiles.value[0].name.replace(/\.(pdf|png|jpg|jpeg|webp)$/i, '');
    link.download = `${baseName}_result.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const printPdf = () => {
    if (!previewIframe.value?.contentWindow) return;
    try {
        previewIframe.value.contentWindow.focus();
        previewIframe.value.contentWindow.print();
    } catch (e) {
        alert('打印功能出错，您的浏览器可能阻止了此操作。');
        console.error('Print error:', e);
    }
};

onUnmounted(() => {
    if (previewPdfUrl.value) {
        URL.revokeObjectURL(previewPdfUrl.value);
    }
});

</script>

<style scoped>
.pdf-preview-container {
    max-height: 80vh;
    overflow: auto;
}
</style>
