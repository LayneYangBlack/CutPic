/**
 * GPT-Image API 适配器
 * - Electron 端：通过 IPC 让主进程发 HTTP 请求（无 CORS 限制）
 * - Web 端：直接 fetch（需要服务器支持 CORS）
 */

const isElectron = typeof window !== 'undefined' && !!window.electron?.ai;

/**
 * Web 端把 baseUrl 替换成本地代理路径，绕过 CORS
 * 开发环境：/ai-api → https://bmai.kun8.vip（vite proxy 转发）
 * 生产环境：需要在服务器配置反代，否则直接请求（中转站若支持 CORS 则正常）
 */
function resolveBaseUrl(baseUrl) {
  if (isElectron) return baseUrl; // Electron 主进程直接请求，无限制
  if (import.meta.env.DEV) return '/ai-api'; // 开发环境走 Vite 代理
  return baseUrl; // 生产环境直接请求
}

// ================== 核心请求函数 ==================

/**
 * 文本生图
 * @returns {Promise<Array<{dataUrl, revisedPrompt}>>}
 */
async function _generateImageFetch({ prompt, apiKey, baseUrl, model, n, size, quality }) {
  const endpoint = `${resolveBaseUrl(baseUrl)}/v1/images/generations`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      n: Math.min(Math.max(1, n), 4),
      size,
      quality,
      response_format: 'b64_json',
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.map(item => ({
    dataUrl: item.b64_json ? `data:image/png;base64,${item.b64_json}` : item.url,
    revisedPrompt: item.revised_prompt || '',
  }));
}

/**
 * 图生图
 * @returns {Promise<Array<{dataUrl, revisedPrompt}>>}
 */
async function _generateFromImageFetch({ prompt, image, apiKey, baseUrl, model, n, size }) {
  const endpoint = `${resolveBaseUrl(baseUrl)}/v1/images/edits`;

  // 非 PNG 先转换
  let imageFile = image;
  if (image instanceof File && !image.type.includes('png')) {
    imageFile = await _convertToPng(image);
  }

  const formData = new FormData();
  formData.append('model', model);
  formData.append('prompt', prompt);
  formData.append('n', String(Math.min(Math.max(1, n), 4)));
  formData.append('size', size);
  formData.append('response_format', 'b64_json');
  formData.append('image', imageFile instanceof File ? imageFile : new File([imageFile], 'reference.png', { type: 'image/png' }));

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.map(item => ({
    dataUrl: item.b64_json ? `data:image/png;base64,${item.b64_json}` : item.url,
    revisedPrompt: item.revised_prompt || '',
  }));
}

/**
 * 将图片转为 PNG Blob
 */
async function _convertToPng(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG 转换失败')), 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('图片加载失败')); };
    img.src = url;
  });
}

/**
 * File 转 DataURL（用于 IPC 传输，不能传 File 对象）
 */
function _fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ================== 公开 API ==================

/**
 * 文本生图
 * @param {Object} params
 * @param {string} params.prompt
 * @param {string} params.apiKey
 * @param {string} params.baseUrl
 * @param {string} [params.model='gpt-5.4']
 * @param {number} [params.n=1]
 * @param {string} [params.size='1024x1024']
 * @param {string} [params.quality='standard']
 * @param {Function} [params.onProgress]
 * @returns {Promise<Array<{dataUrl, revisedPrompt}>>}
 */
export async function generateImage({ prompt, apiKey, baseUrl, model = 'gpt-image-2', n = 1, size = '1024x1024', quality = 'standard', onProgress }) {
  if (!prompt?.trim()) throw new Error('提示词不能为空');
  if (!apiKey) throw new Error('API Key 未配置');

  onProgress?.({ status: 'requesting', message: '正在发送请求...' });

  let images;
  if (isElectron) {
    // Electron 走主进程 IPC，无 CORS 限制
    const result = await window.electron.ai.generateImage({ prompt: prompt.trim(), apiKey, baseUrl, model, n, size, quality });
    if (!result.success) throw new Error(result.error);
    images = result.images;
  } else {
    images = await _generateImageFetch({ prompt: prompt.trim(), apiKey, baseUrl, model, n, size, quality });
  }

  onProgress?.({ status: 'completed', message: '生成完成！' });
  return images;
}

/**
 * 图生图
 * @param {Object} params
 * @param {string} params.prompt
 * @param {File|Blob} params.image - 参考图
 * @param {string} params.apiKey
 * @param {string} params.baseUrl
 * @param {string} [params.model='gpt-5.4']
 * @param {number} [params.n=1]
 * @param {string} [params.size='1024x1024']
 * @param {Function} [params.onProgress]
 * @returns {Promise<Array<{dataUrl, revisedPrompt}>>}
 */
export async function generateImageFromImage({ prompt, image, apiKey, baseUrl, model = 'gpt-image-2', n = 1, size = '1024x1024', onProgress }) {
  if (!prompt?.trim()) throw new Error('提示词不能为空');
  if (!image) throw new Error('参考图不能为空');
  if (!apiKey) throw new Error('API Key 未配置');

  onProgress?.({ status: 'preparing', message: '正在准备图片...' });

  let images;
  if (isElectron) {
    // IPC 不能传 File 对象，先转成 DataURL 字符串
    const imageBase64 = await _fileToDataUrl(image);
    onProgress?.({ status: 'uploading', message: '正在上传参考图...' });
    const result = await window.electron.ai.generateImageFromImage({ prompt: prompt.trim(), imageBase64, apiKey, baseUrl, model, n, size });
    if (!result.success) throw new Error(result.error);
    images = result.images;
  } else {
    onProgress?.({ status: 'uploading', message: '正在上传参考图...' });
    images = await _generateFromImageFetch({ prompt: prompt.trim(), image, apiKey, baseUrl, model, n, size });
  }

  onProgress?.({ status: 'completed', message: '生成完成！' });
  return images;
}

/**
 * 批量生成
 * @param {Object} params
 * @param {Array<string>} params.prompts
 * @param {File|Blob|null} [params.referenceImage]
 * @param {string} params.apiKey
 * @param {string} params.baseUrl
 * @param {string} [params.model='gpt-5.4']
 * @param {number} [params.imagesPerPrompt=1]
 * @param {string} [params.size='1024x1024']
 * @param {string} [params.quality='standard']
 * @param {Function} [params.onProgress]
 * @returns {Promise<Array<{prompt, images, success, error}>>}
 */
export async function batchGenerateImages({ prompts, referenceImage = null, apiKey, baseUrl, model = 'gpt-image-2', imagesPerPrompt = 1, size = '1024x1024', quality = 'standard', onProgress }) {
  if (!prompts?.length) throw new Error('提示词列表不能为空');

  const results = [];
  const total = prompts.length;

  for (let i = 0; i < total; i++) {
    const prompt = prompts[i];

    onProgress?.({ status: 'processing', message: `正在生成第 ${i + 1}/${total} 组...`, current: i + 1, total, prompt });

    try {
      const images = referenceImage
        ? await generateImageFromImage({ prompt, image: referenceImage, apiKey, baseUrl, model, n: imagesPerPrompt, size })
        : await generateImage({ prompt, apiKey, baseUrl, model, n: imagesPerPrompt, size, quality });

      results.push({ prompt, images, success: true });
    } catch (error) {
      console.error(`生成失败 (prompt: "${prompt}"):`, error);
      results.push({ prompt, images: [], success: false, error: error.message });
    }

    // 避免请求过快触发限流
    if (i < total - 1) await new Promise(r => setTimeout(r, 500));
  }

  onProgress?.({ status: 'completed', message: '全部完成！', current: total, total });
  return results;
}
