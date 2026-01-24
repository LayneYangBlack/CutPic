// 文件对话框处理模块 - Desktop独有功能
import { ipcMain, dialog, app } from 'electron';
import path from 'path';

/**
 * 选择单个文件
 */
ipcMain.handle('dialog:select-file', async (event, options = {}) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    title: options.title || '选择文件',
    defaultPath: options.defaultPath || app.getPath('documents'),
    filters: options.filters || [
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return {
      success: false,
      canceled: true,
    };
  }

  return {
    success: true,
    path: result.filePaths[0],
    name: path.basename(result.filePaths[0]),
  };
});

/**
 * 选择多个文件
 */
ipcMain.handle('dialog:select-files', async (event, options = {}) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    title: options.title || '选择文件',
    defaultPath: options.defaultPath || app.getPath('documents'),
    filters: options.filters || [
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return {
      success: false,
      canceled: true,
    };
  }

  return {
    success: true,
    paths: result.filePaths,
    count: result.filePaths.length,
  };
});

/**
 * 选择文件夹
 */
ipcMain.handle('dialog:select-folder', async (event, options = {}) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: options.title || '选择文件夹',
    defaultPath: options.defaultPath || app.getPath('documents'),
  });

  if (result.canceled || result.filePaths.length === 0) {
    return {
      success: false,
      canceled: true,
    };
  }

  return {
    success: true,
    path: result.filePaths[0],
    name: path.basename(result.filePaths[0]),
  };
});

/**
 * 保存文件对话框
 */
ipcMain.handle('dialog:save-file', async (event, options = {}) => {
  const result = await dialog.showSaveDialog({
    title: options.title || '保存文件',
    defaultPath: options.defaultPath || path.join(app.getPath('documents'), options.defaultName || 'untitled'),
    filters: options.filters || [
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return {
      success: false,
      canceled: true,
    };
  }

  return {
    success: true,
    path: result.filePath,
    name: path.basename(result.filePath),
  };
});

/**
 * 获取系统路径
 */
ipcMain.handle('path:get-documents', () => {
  return app.getPath('documents');
});

ipcMain.handle('path:get-downloads', () => {
  return app.getPath('downloads');
});

ipcMain.handle('path:get-desktop', () => {
  return app.getPath('desktop');
});

console.log('✅ 对话框处理模块已加载');
