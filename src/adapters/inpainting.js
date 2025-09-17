import cv from 'opencv-ts';

// Simple helper to load an image from a URL
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image from ${url}`));
    img.src = url;
  });
}

// Converts image matrix to planar Uint8Array
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

// Processes the mask, creating a binary mask of 0s and 255s
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


// Resizes the mask to match the image dimensions
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

// Converts the final planar model output to an ImageData object for rendering
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
      chwToHwcData.push(255); // Alpha
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

let session = null;

export default async function inpaint(imageFile, maskBase64) {
  const ort = window.ort;
  if (!ort) {
    throw new Error("ONNX Runtime is not available. Please check the script tag in index.html.");
  }

  if (!session) {
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
    session = await ort.InferenceSession.create('./inpaint.onnx', {
      executionProviders: ['wasm'],
    });
  }

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