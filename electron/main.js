// Electron 主进程 - 应用程序入口
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM模式获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 导入 fs 模块（ES 模块方式）
import fs from 'fs';

// 开发环境检测
// vite-plugin-electron 会设置 VITE_DEV_SERVER_URL 环境变量
const isDev = !!process.env.VITE_DEV_SERVER_URL;

// 调试日志
console.log('🔍 环境变量检测:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  VITE_DEV_SERVER_URL:', process.env.VITE_DEV_SERVER_URL);
console.log('  isDev:', isDev);
console.log('🚀 Electron 主进程代码加载完成');

let mainWindow;

// 创建主窗口
function createWindow() {
  console.log('🪟 开始创建窗口...');

  // 调试：检查 preload 路径
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('🔍 [调试] __dirname:', __dirname);
  console.log('🔍 [调试] preload 路径:', preloadPath);
  console.log('🔍 [调试] preload 文件是否存在:', fs.existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      // 预加载脚本（安全桥接）
      preload: path.join(__dirname, 'preload.js'),
      // 启用Node集成（通过预加载脚本暴露API）
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // 关闭沙箱，允许 ESM 格式的 preload 加载
      // 启用webview标签（如果需要）
      webviewTag: false,
    },
    // 窗口样式
    titleBarStyle: 'default',
    backgroundColor: '#ffffff',
    show: false, // 先隐藏，等ready-to-show再��示（避免白屏）
  });

  // 窗口准备好后再显示（避免闪烁）
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 加载应用
  if (isDev) {
    // 开发模式：加载Vite开发服务器
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    console.log('📱 开发模式：加载', devServerUrl);
    mainWindow.loadURL(devServerUrl);
    // 自动打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式：加载打包后的文件
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('📦 生产模式：加载', indexPath);
    mainWindow.loadFile(indexPath);
  }

  // 监听加载错误
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('❌ 页面加载失败:', errorCode, errorDescription);
  });

  // 监听窗口关闭
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 应用启动
console.log('🚀 Electron 应用启动中...');
app.whenReady().then(() => {
  console.log('✅ Electron 应用就绪，创建窗口...');
  createWindow();

  // macOS：点击Dock图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出（macOS除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================================
// IPC 通信处理（与渲染进程通信）
// ============================================

// 导入IPC处理模块
import './ipc/file-handler.js';
import './ipc/dialog-handler.js';
import './ipc/ai-handler.js'; // AI 图像生成（绕过 CORS）

// 基础示例：Ping-Pong测试
ipcMain.handle('ping', () => {
  console.log('收到渲染进程的ping请求');
  return 'pong';
});

// 获取应用版本
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// 获取平台信息
ipcMain.handle('get-platform', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    isWindows: process.platform === 'win32',
    isMac: process.platform === 'darwin',
    isLinux: process.platform === 'linux',
  };
});
