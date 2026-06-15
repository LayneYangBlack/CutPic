// AI 图像生成 IPC 处理器
// 主进程发 HTTP 请求，绕过浏览器 CORS 限制
import { ipcMain } from 'electron';
import https from 'https';
import http from 'http';
import { URL } from 'url';

/**
 * 用 Node.js 原生 http/https 模块发 JSON 请求
 */
function httpRequest(urlStr, options, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const mod = url.protocol === 'https:' ? https : http;

    const req = mod.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method || 'POST',
        headers: options.headers,
        timeout: 300000, // 5 分钟
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf-8');
          resolve({ status: res.statusCode, body });
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时（5分钟），请检查网络或稍后重试'));
    });

    if (body) req.write(body);
    req.end();
  });
}

/**
 * 用 Node.js 发 multipart/form-data 请求（图生图）
 */
function httpMultipartRequest(urlStr, headers, fields, fileBuffer, fileName) {
  return new Promise((resolve, reject) => {
    const boundary = `----FormBoundary${Date.now().toString(16)}`;
    const parts = [];

    for (const [key, value] of Object.entries(fields)) {
      parts.push(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
      );
    }

    parts.push(
      `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${fileName}"\r\nContent-Type: image/png\r\n\r\n`
    );

    const header = Buffer.from(parts.join(''));
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, fileBuffer, footer]);

    const url = new URL(urlStr);
    const mod = url.protocol === 'https:' ? https : http;

    const req = mod.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
        },
        timeout: 300000,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf-8') });
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时（5分钟）'));
    });

    req.write(body);
    req.end();
  });
}

/**
 * 文本生图 IPC handler
 */
ipcMain.handle('ai:generate-image', async (_event, { prompt, apiKey, baseUrl, model, n, size, quality }) => {
  try {
    const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/images/generations`;
    console.log(`[AI] 文本生图: ${endpoint}, model=${model}, n=${n}, size=${size}`);

    const body = JSON.stringify({
      model,
      prompt,
      n: Math.min(Math.max(1, n), 4),
      size,
      quality,
      response_format: 'b64_json',
    });

    const { status, body: resBody } = await httpRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, body);

    const data = JSON.parse(resBody);
    console.log(`[AI] 文本生图响应: status=${status}, error=${data.error?.message || '无'}`);

    if (status !== 200) {
      // 组合更详细的错误信息：HTTP 状态 + 原始 message
      const apiMsg = data.error?.message || data.message || resBody.substring(0, 200);
      const errType = data.error?.type || data.error?.code || '';
      const msg = `[HTTP ${status}${errType ? ` · ${errType}` : ''}] ${apiMsg}`;
      return { success: false, error: msg, status, raw: data };
    }

    return {
      success: true,
      images: data.data.map(item => ({
        dataUrl: item.b64_json
          ? `data:image/png;base64,${item.b64_json}`
          : item.url,
        revisedPrompt: item.revised_prompt || '',
      })),
    };
  } catch (error) {
    console.error('[ai:generate-image] 错误:', error);
    return { success: false, error: error.message };
  }
});

/**
 * 图生图 IPC handler
 */
ipcMain.handle('ai:generate-image-from-image', async (_event, { prompt, imageBase64, apiKey, baseUrl, model, n, size }) => {
  try {
    const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/images/edits`;

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');

    const { status, body: resBody } = await httpMultipartRequest(
      endpoint,
      { 'Authorization': `Bearer ${apiKey}` },
      {
        model,
        prompt,
        n: String(Math.min(Math.max(1, n), 4)),
        size,
        response_format: 'b64_json',
      },
      fileBuffer,
      'reference.png'
    );

    const data = JSON.parse(resBody);
    console.log(`[AI] 图生图响应: status=${status}, error=${data.error?.message || '无'}`);

    if (status !== 200) {
      const apiMsg = data.error?.message || data.message || resBody.substring(0, 200);
      const errType = data.error?.type || data.error?.code || '';
      const msg = `[HTTP ${status}${errType ? ` · ${errType}` : ''}] ${apiMsg}`;
      return { success: false, error: msg, status, raw: data };
    }

    return {
      success: true,
      images: data.data.map(item => ({
        dataUrl: item.b64_json
          ? `data:image/png;base64,${item.b64_json}`
          : item.url,
        revisedPrompt: item.revised_prompt || '',
      })),
    };
  } catch (error) {
    console.error('[ai:generate-image-from-image] 错误:', error);
    return { success: false, error: error.message };
  }
});
