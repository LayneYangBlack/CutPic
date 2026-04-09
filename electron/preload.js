// Electron 预加载脚本 - 安全桥接渲染进程和主进程
import { contextBridge, ipcRenderer } from 'electron';

/**
 * 通过contextBridge暴露安全的API给渲染进程
 * 渲染进程可通过 window.electron.xxx 调用
 */
contextBridge.exposeInMainWorld('electron', {
  // ============================================
  // 平台检测API
  // ============================================
  platform: {
    // 获取平台信息
    getInfo: () => ipcRenderer.invoke('get-platform'),
    // 判断是否为Electron环境
    isElectron: true,
  },

  // ============================================
  // 文件系统API（最优方案）
  // ============================================
  file: {
    // 读取文件（支持本地路径）
    read: (filePath) => ipcRenderer.invoke('file:read', filePath),

    // 读取图片文件（返回base64）
    readImage: (filePath) => ipcRenderer.invoke('file:read-image', filePath),

    // 批量读取图片文件夹
    readImageFolder: (folderPath) => ipcRenderer.invoke('file:read-image-folder', folderPath),

    // 保存文件（选择保存位置）
    save: (buffer, defaultName) => ipcRenderer.invoke('file:save', buffer, defaultName),

    // 保存Blob文件
    saveBlob: async (blob, defaultName) => {
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return ipcRenderer.invoke('file:save', buffer, defaultName);
    },

    // 读取Excel文件（优化版）
    readExcel: (filePath) => ipcRenderer.invoke('file:read-excel', filePath),

    // 写入Excel文件
    writeExcel: (data, defaultName) => ipcRenderer.invoke('file:write-excel', data, defaultName),
  },

  // ============================================
  // 文件对话框API
  // ============================================
  dialog: {
    // 选择单个文件
    selectFile: (options) => ipcRenderer.invoke('dialog:select-file', options),

    // 选择多个文件
    selectFiles: (options) => ipcRenderer.invoke('dialog:select-files', options),

    // 选择文件夹
    selectFolder: (options) => ipcRenderer.invoke('dialog:select-folder', options),

    // 保存文件对话框
    saveFile: (options) => ipcRenderer.invoke('dialog:save-file', options),
  },

  // ============================================
  // 应用信息API
  // ============================================
  app: {
    // 获取应用版本
    getVersion: () => ipcRenderer.invoke('get-app-version'),

    // Ping测试
    ping: () => ipcRenderer.invoke('ping'),
  },

  // ============================================
  // 路径工具API
  // ============================================
  path: {
    // 获取用户文档目录
    getDocumentsPath: () => ipcRenderer.invoke('path:get-documents'),

    // 获取用户下载目录
    getDownloadsPath: () => ipcRenderer.invoke('path:get-downloads'),

    // 获取用户桌面目录
    getDesktopPath: () => ipcRenderer.invoke('path:get-desktop'),
  },
});

console.log('✅ Electron预加载脚本已加载 - API已注入到window.electron');
