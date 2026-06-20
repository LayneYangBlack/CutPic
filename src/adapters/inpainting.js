import cv from 'opencv-ts';
import * as ort from 'onnxruntime-web';

// --- Session Management ---
let sessionPromise = null;

const MODEL_CACHE_NAME = 'inpaint-model-v1';

async function fetchWithProgress(url, progressCallback) {
    // 命中缓存则直接返回，跳过网络下载
    if ('caches' in window) {
        const cache = await caches.open(MODEL_CACHE_NAME);
        const cached = await cache.match(url);
        if (cached) {
            console.log('模型文件命中缓存，跳过下载');
            if (progressCallback) progressCallback(80);
            return cached.arrayBuffer();
        }
    }

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const contentLength = response.headers.get('content-length');
    if (!contentLength) {
        console.warn('Content-Length header not found. Progress will not be available.');
        const buffer = await response.arrayBuffer();
        // 写入缓存（无进度版本）
        if ('caches' in window) {
            const cache = await caches.open(MODEL_CACHE_NAME);
            await cache.put(url, new Response(buffer.slice(0)));
        }
        return buffer;
    }

    const total = parseInt(contentLength, 10);
    let loaded = 0;
    const chunks = [];

    const reader = response.body.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        if (progressCallback) progressCallback((loaded / total) * 100);
    }

    // 合并所有 chunk
    const buffer = new Uint8Array(loaded);
    let offset = 0;
    for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
    }
    const arrayBuffer = buffer.buffer;

    // 写入 Cache API，下次刷新直接命中
    if ('caches' in window) {
        const cache = await caches.open(MODEL_CACHE_NAME);
        await cache.put(url, new Response(arrayBuffer.slice(0), {
            headers: { 'Content-Type': 'application/octet-stream' },
        }));
        console.log('模型文件已写入缓存');
    }

    return arrayBuffer;
}

export async function checkModelCached() {
  if (!('caches' in window)) return false;
  const cache = await caches.open(MODEL_CACHE_NAME);
  const modelUrl = new URL('/inpaint.onnx', window.location.href).toString();
  const cached = await cache.match(modelUrl);
  return !!cached;
}

export function initInpaintSession(progressCallback) {
  sessionPromise = new Promise(async (resolve, reject) => {
    try {
      if (!ort) {
        throw new Error("ONNX Runtime is not available.");
      }

      // 配置 WASM 环境
      ort.env.wasm.wasmPaths = '/';
      ort.env.wasm.numThreads = 1; // 强制使用单线程
      ort.env.wasm.simd = true; // 启用SIMD加速

      console.log('=== ONNX Runtime 配置 ===');
      console.log('WASM 路径:', ort.env.wasm.wasmPaths);
      console.log('线程数:', ort.env.wasm.numThreads);
      console.log('SIMD:', ort.env.wasm.simd);

      const modelPath = new URL('/inpaint.onnx', window.location.href).toString();
      console.log('模型路径:', modelPath);

      // 下载模型文件（0-80%）
      console.log('开始下载模型文件...');
      const startTime = Date.now();
      const modelBuffer = await fetchWithProgress(modelPath, (progress) => {
        if (progressCallback) {
          progressCallback(progress * 0.8);
        }
      });
      const downloadTime = Date.now() - startTime;
      console.log(`模型文件下载完成，大小: ${(modelBuffer.byteLength / 1024 / 1024).toFixed(2)}MB，耗时: ${(downloadTime / 1000).toFixed(2)}秒`);

      // 创建推理会话（80-100%）
      if (progressCallback) {
        progressCallback(80);
      }
      console.log('开始创建推理会话...');
      const sessionStartTime = Date.now();

      try {
        const session = await ort.InferenceSession.create(modelBuffer, {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'basic',
        });

        const sessionTime = Date.now() - sessionStartTime;
        console.log(`推理会话创建完成，耗时: ${(sessionTime / 1000).toFixed(2)}秒`);
        console.log('使用的执行提供者:', session.executionProviders);

        if (progressCallback) {
          progressCallback(100);
        }

        resolve(session);
      } catch (sessionError) {
        console.error('创建推理会话失败:', sessionError);
        console.error('错误类型:', sessionError.name);
        console.error('错误消息:', sessionError.message);
        console.error('错误堆栈:', sessionError.stack);
        throw new Error(`推理会话创建失败: ${sessionError.message}`);
      }
    } catch (error) {
      console.error('=== 初始化失败 ===');
      console.error('错误:', error);
      console.error('错误堆栈:', error.stack);
      reject(error);
    }
  });
  return sessionPromise;
}

// --- Image Processing Functions ---

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image from ${url}`));
    img.src = url;
  });
}

function imgProcess(img) {
  const channels = new cv.MatVector();
  cv.split(img, channels);
  const C = channels.size();
  const H = img.rows;
  const W = img.cols;
  const chwArray = new Uint8Array(C * H * W);
  for (let c = 0; c < C; c++) {
    const channelData = channels.get(c).data;
    for (let h = 0; h < H; h++) {
      for (let w = 0; w < W; w++) {
        chwArray[c * H * W + h * W + w] = channelData[h * W + w];
      }
    }
  }
  channels.delete();
  return chwArray;
}

function markProcess(img) {
    const channels = new cv.MatVector();
    cv.split(img, channels);
    const C = 1;
    const H = img.rows;
    const W = img.cols;
    const chwArray = new Uint8Array(C * H * W);
    const channelData = channels.get(0).data;
    for (let h = 0; h < H; h++) {
        for (let w = 0; w < W; w++) {
            chwArray[h * W + w] = (channelData[h * W + w] === 0) * 255;
        }
    }
    channels.delete();
    return chwArray;
}

function resizeMark(image, width, height) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Unable to get canvas context'));
      return;
    }
    ctx.drawImage(image, 0, 0, width, height);
    const resizedImageUrl = canvas.toDataURL();
    const resizedImage = new Image();
    resizedImage.onload = () => resolve(resizedImage);
    resizedImage.onerror = () => reject(new Error('Failed to load resized image'));
    resizedImage.src = resizedImageUrl;
  });
}

function postProcess(floatData, width, height) {
  const chwToHwcData = [];
  const size = width * height;
  for (let h = 0; h < height; h++) {
    for (let w = 0; w < width; w++) {
      for (let c = 0; c < 3; c++) {
        const chwIndex = c * size + h * width + w;
        let pixelVal = floatData[chwIndex];
        if (pixelVal > 255) pixelVal = 255;
        else if (pixelVal < 0) pixelVal = 0;
        chwToHwcData.push(pixelVal);
      }
      chwToHwcData.push(255);
    }
  }
  return new ImageData(new Uint8ClampedArray(chwToHwcData), width, height);
}

function imageDataToDataURL(imageData) {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

// --- Main Inpaint Function ---

export default async function inpaint(imageFile, maskBase64) {
  if (!sessionPromise) {
    throw new Error('Inpaint session not initialized. Call initInpaintSession() first.');
  }
  const session = await sessionPromise;

  const [originalImg, originalMark] = await Promise.all([
    imageFile instanceof HTMLImageElement ? imageFile : await loadImage(URL.createObjectURL(imageFile)),
    await loadImage(maskBase64),
  ]);

  const resizedMark = await resizeMark(originalMark, originalImg.width, originalImg.height);

  const src = cv.imread(originalImg);
  const src_rgb = new cv.Mat();
  cv.cvtColor(src, src_rgb, cv.COLOR_RGBA2RGB);
  const imgData = imgProcess(src_rgb);
  src.delete();
  src_rgb.delete();

  const markSrc = cv.imread(resizedMark);
  const mark_grey = new cv.Mat();
  cv.cvtColor(markSrc, mark_grey, cv.COLOR_RGBA2GRAY);
  const markData = markProcess(mark_grey);
  markSrc.delete();
  mark_grey.delete();

  const imageTensor = new ort.Tensor('uint8', imgData, [1, 3, originalImg.height, originalImg.width]);
  const maskTensor = new ort.Tensor('uint8', markData, [1, 1, originalImg.height, originalImg.width]);

  const feeds = {
    [session.inputNames[0]]: imageTensor,
    [session.inputNames[1]]: maskTensor,
  };

  const results = await session.run(feeds);
  const outsTensor = results[session.outputNames[0]];
  const finalImageData = postProcess(outsTensor.data, originalImg.width, originalImg.height);
  
  return imageDataToDataURL(finalImageData);
}