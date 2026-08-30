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
                external: ['electron'],
              },
            },
            // 设置环境变量，让主进程知道是开发模式
            define: {
              'process.env.VITE_DEV_SERVER_URL': JSON.stringify('http://localhost:5173'),
            },
          },
        },
        {
          // 预加载脚本
          entry: 'electron/preload.js',
          // 预加载脚本编译完成后重新加载窗口（不重启进程）
          onstart({ reload }) {
            reload();
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              // 强制编译为 CommonJS 格式（Electron preload 必须使用 CJS）
              lib: {
                entry: 'electron/preload.js',
                formats: ['cjs'], // 关键：强制 CommonJS 格式
                fileName: () => 'preload.js',
              },
              rollupOptions: {
                external: ['electron'],
                output: {
                  // 确保输出为 CommonJS 格式
                  format: 'cjs',
                  // 使用 require 而不是 import
                  exports: 'auto',
                },
              },
            },
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
          // JS 文件名加内容 hash：每次部署文件名变化，浏览器强制拉新，避免缓存旧代码
          // assetFileNames 保持不带 hash：wasm/onnx 由库在运行时按路径加载，改名有风险
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
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
      // 配置 WASM 文件的 MIME 类型
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp'
      },
      // 配置静态资源的 MIME 类型
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