import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
// Electron插件
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 判断是否为Electron模式
  const isElectronMode = mode === 'electron';

  // 基础插件（所有模式都需要）
  const plugins = [vue()];

  // 只在Electron模式下加载Electron插件
  if (isElectronMode) {
    plugins.push(
      // Electron插件配置
      electron([
        {
          // 主进程入口
          entry: 'electron/main.js',
          // 主进程编译完成后启动 Electron（使用解构获取 startup 方法）
          onstart({ startup }) {
            console.log('🔧 [vite.config] 主进程编译完成，准备启动 Electron...');
            startup();
            console.log('🔧 [vite.config] startup() 已调用');
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                // Node 内置模块和 electron 都不打包，直接 require
                external: ['electron', 'https', 'http', 'url', 'path', 'fs', 'fs/promises', 'buffer', 'os'],
              },
            },
            // 设置环境变量，让主进程知道是开发模式
            define: {
              'process.env.VITE_DEV_SERVER_URL': JSON.stringify('http://localhost:5173'),
            },
          },
        },
        {
          // 预加载脚本（vite-plugin-electron 默认会编译为 CJS）
          entry: 'electron/preload.js',
          onstart({ reload }) {
            reload();
          },
        },
      ]),
      // 渲染进程插件（让渲染进程可以使用Node.js模块）
      renderer()
    );
  }

  return {
    plugins,
    base: '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        },
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]'
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        'vue': 'vue/dist/vue.runtime.esm-browser.js'
      }
    },
    server: {
      port: 5173,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp'
      },
      // 开发环境代理：解决浏览器 CORS 问题
      proxy: {
        '/ai-api': {
          target: 'https://bmai.kun8.vip',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ai-api/, ''),
        },
      },
      fs: {
        strict: false
      }
    },
    // 优化配置：确保 WASM 文件被正确处理
    optimizeDeps: {
      exclude: ['onnxruntime-web']
    },
    // 配置 assetsInclude 以正确处理 WASM 文件
    assetsInclude: ['**/*.wasm', '**/*.onnx']
  };
})