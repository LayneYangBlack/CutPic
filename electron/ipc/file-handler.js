// 文件系统处理模块 - Desktop最优方案（使用Node.js原生API）
import { ipcMain } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { Buffer } from 'buffer';

/**
 * 读取文件（通用）
 * Desktop优势：直接使用Node.js fs模块，性能更好
 */
ipcMain.handle('file:read', async (event, filePath) => {
  try {
    const buffer = await fs.readFile(filePath);
    return {
      success: true,
      data: buffer.toString('base64'),
      size: buffer.length,
    };
  } catch (error) {
    console.error('读取文件失败:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * 读取图片文件（返回base64 DataURL）
 * Desktop优势：可以直接读取本地路径，无需通过input[type=file]
 */
ipcMain.handle('file:read-image', async (event, filePath) => {
  try {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // 根据扩展名确定MIME类型
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml',
    };

    const mimeType = mimeTypes[ext] || 'image/jpeg';
    const base64 = buffer.toString('base64');
    const dataURL = `data:${mimeType};base64,${base64}`;

    return {
      success: true,
      data: dataURL,
      path: filePath,
      name: path.basename(filePath),
      size: buffer.length,
    };
  } catch (error) {
    console.error('读取图片失败:', filePath, error);
    return {
      success: false,
      error: error.message,
      path: filePath,
    };
  }
});

/**
 * 批量读取图片文件夹
 * Desktop独有功能：可以直接遍历文件夹
 */
ipcMain.handle('file:read-image-folder', async (event, folderPath) => {
  try {
    const files = await fs.readdir(folderPath);

    // 筛选图片文件
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    // 批量读取所有图片
    const results = [];
    for (const filename of imageFiles) {
      const fullPath = path.join(folderPath, filename);
      const result = await ipcMain.emit('file:read-image', event, fullPath);

      if (result && result.success) {
        results.push({
          name: filename,
          path: fullPath,
          data: result.data,
          size: result.size,
        });
      }
    }

    return {
      success: true,
      images: results,
      count: results.length,
      folderPath: folderPath,
    };
  } catch (error) {
    console.error('读取图片文件夹失败:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * 读取文件夹中的所有文件（包括json和图片）
 * 用于JSON自动排版功能
 */
ipcMain.handle('file:read-folder-contents', async (event, folderPath) => {
  try {
    const files = await fs.readdir(folderPath);
    const results = [];

    for (const filename of files) {
      const fullPath = path.join(folderPath, filename);
      const stat = await fs.stat(fullPath);

      // 跳过文件夹
      if (stat.isDirectory()) continue;

      const ext = path.extname(filename).toLowerCase();

      // 读取JSON文件
      if (ext === '.json') {
        const content = await fs.readFile(fullPath, 'utf-8');
        results.push({
          name: filename,
          path: fullPath,
          type: 'json',
          content: content,
          size: stat.size,
        });
      }
      // 读取图片文件
      else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) {
        const buffer = await fs.readFile(fullPath);
        const mimeTypes = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.bmp': 'image/bmp',
        };
        const mimeType = mimeTypes[ext] || 'image/jpeg';
        const base64 = buffer.toString('base64');
        const dataURL = `data:${mimeType};base64,${base64}`;

        results.push({
          name: filename,
          path: fullPath,
          type: 'image',
          data: dataURL,
          size: stat.size,
        });
      }
    }

    return {
      success: true,
      files: results,
      count: results.length,
      folderPath: folderPath,
    };
  } catch (error) {
    console.error('读取文件夹内容失败:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * 保存文件（会弹出保存对话框）
 * Desktop优势：可以让用户选择保存位置，不像浏览器只能下载到Downloads文件夹
 */
ipcMain.handle('file:save', async (event, buffer, defaultName) => {
  try {
    const { dialog } = await import('electron');
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: defaultName,
      filters: [
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (canceled || !filePath) {
      return {
        success: false,
        canceled: true,
      };
    }

    // 将buffer写入文件
    const bufferData = Buffer.from(buffer);
    await fs.writeFile(filePath, bufferData);

    return {
      success: true,
      path: filePath,
      size: bufferData.length,
    };
  } catch (error) {
    console.error('保存文件失败:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * 读取Excel文件（Desktop优化版）
 * Desktop优势：直接读取文件，不需要FileReader
 */
ipcMain.handle('file:read-excel', async (event, filePath) => {
  try {
    const XLSX = await import('xlsx');
    const buffer = await fs.readFile(filePath);

    // 使用xlsx库解析
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);

    return {
      success: true,
      data: jsonData,
      columns: jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
      rowCount: jsonData.length,
      path: filePath,
    };
  } catch (error) {
    console.error('读取Excel失败:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * 写入Excel文件
 * Desktop优势：直接保存文件，不需要下载
 */
ipcMain.handle('file:write-excel', async (event, data, defaultName) => {
  try {
    const XLSX = await import('xlsx');
    const { dialog } = await import('electron');

    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: defaultName || 'export.xlsx',
      filters: [
        { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
        { name: 'CSV Files', extensions: ['csv'] },
      ],
    });

    if (canceled || !filePath) {
      return {
        success: false,
        canceled: true,
      };
    }

    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // 写入文件
    XLSX.writeFile(wb, filePath);

    return {
      success: true,
      path: filePath,
    };
  } catch (error) {
    console.error('写入Excel失败:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * 批量保存图片到文件夹（每组一个子文件夹）
 * 弹出目录选择框，然后在选中目录下创建子文件夹并写入图片
 * results: Array<{ folderName: string, images: Array<{ filename: string, base64: string }> }>
 */
ipcMain.handle('file:save-batch-results', async (event, results) => {
  try {
    const { dialog } = await import('electron');

    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: '选择保存目录',
      properties: ['openDirectory', 'createDirectory'],
    });

    if (canceled || !filePaths?.[0]) {
      return { success: false, canceled: true };
    }

    const baseDir = filePaths[0];
    const saved = [];

    for (const group of results) {
      // 文件夹名：清理非法字符，最长 50 字符
      const safeName = group.folderName
        .replace(/[\\/:*?"<>|]/g, '_')
        .substring(0, 50)
        .trim() || `group_${Date.now()}`;

      const groupDir = path.join(baseDir, safeName);
      await fs.mkdir(groupDir, { recursive: true });

      for (const img of group.images) {
        const base64Data = img.base64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const filePath = path.join(groupDir, img.filename);
        await fs.writeFile(filePath, buffer);
        saved.push(filePath);
      }
    }

    return { success: true, baseDir, count: saved.length };
  } catch (error) {
    console.error('批量保存失败:', error);
    return { success: false, error: error.message };
  }
});

/**
 * 保存 zip 文件
 * autoPath=false → 弹出另存为对话框
 * autoPath=true  → 直接保存到 savePath（不弹框），savePath 为空时用 Downloads
 */
ipcMain.handle('file:save-zip', async (event, base64Zip, defaultName, autoPath = false, savePath = '') => {
  try {
    const { app } = await import('electron');

    let filePath;
    if (autoPath) {
      // 用指定目录，没有则 fallback 到系统 Downloads
      const baseDir = savePath || app.getPath('downloads');
      filePath = path.join(baseDir, defaultName);
    } else {
      const { dialog } = await import('electron');
      const result = await dialog.showSaveDialog({
        title: '选择保存位置',
        defaultPath: path.join(savePath || app.getPath('downloads'), defaultName),
        filters: [{ name: 'ZIP 压缩包', extensions: ['zip'] }],
      });
      if (result.canceled || !result.filePath) return { success: false, canceled: true };
      filePath = result.filePath;
    }

    const buffer = Buffer.from(base64Zip, 'base64');
    await fs.writeFile(filePath, buffer);
    console.log(`[ZIP] 已保存: ${filePath}`);
    return { success: true, path: filePath };
  } catch (error) {
    console.error('保存 zip 失败:', error);
    return { success: false, error: error.message };
  }
});

console.log('✅ 文件处理模块已加载');
