# AI图片工具集 - Electron桌面应用

一个基于Vue 3 + Electron的桌面图片处理工具集，支持Web和Desktop双模式运行。

## ✨ 功能特点

### 核心功能
- 🖼️ **图片裁剪** - 自定义尺寸裁剪、智能扩展
- 📊 **PS批量套图** - 可视化模板编辑、Excel批量数据导入、一键生成
- 📄 **PDF合成** - 多图片合成PDF文档
- 📐 **规格图生成** - 商品规格图快速生成
- 📈 **规格统计** - 数据统计与分析
- 🏷️ **徽章排版** - 徽章批量排版工具

### 双模式支持
- 🌐 **Web模式** - 浏览器访问，支持URL图片
- 🖥️ **Desktop模式** - 桌面应用，支持本地文件路径

### Desktop模式优势
| 功能 | Web模式 | Desktop模式 |
|------|---------|-------------|
| 文件路径 | ❌ 仅URL | ✅ 本地路径 `C:\xxx\image.jpg` |
| 文件选择 | Input元素 | 原生对话框 |
| 文件保存 | 下载到Downloads | 用户选择位置 |
| 批量处理 | 手动选择 | 文件夹扫描 |
| 离线使用 | ❌ 需要网络 | ✅ 完全离线 |

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式

#### Web模式（浏览器）
```bash
npm run dev
```
访问：http://localhost:5173

#### Electron模式（桌面应用）
```bash
npm run dev:electron
```
自动打开Electron窗口

### 生产打包

#### Web版打包
```bash
npm run build
```
生成 `dist/` 文件夹，部署到服务器

#### Desktop版打包

**Windows安装包：**
```bash
npm run package:win
```

**Mac安装包：**
```bash
npm run package:mac
```

**Linux安装包：**
```bash
npm run package:linux
```

**所有平台：**
```bash
npm run package
```

## 🛠️ 技术栈

### 前端框架
- Vue 3 (Composition API)
- Vue Router
- TailwindCSS

### 桌面端
- Electron 40.0.0
- vite-plugin-electron

### 图片处理
- Fabric.js v6 (Canvas操作)
- Vue Cropper (图片裁剪)

### 数据处理
- XLSX (Excel读写)
- JSZip (批量打包)
- FileSaver.js (文件下载)

### 构建工具
- Vite 5.4.19
- electron-builder (打包)

## 📂 项目结构

```
CutPic/
├── electron/                    # Electron相关代码
│   ├── main.js                 # 主进程入口
│   ├── preload.js              # 预加载脚本（安全桥接）
│   └── ipc/                    # IPC通信模块
│       ├── file-handler.js     # 文件系统操作
│       └── dialog-handler.js   # 文件对话框
│
├── src/                        # Vue源码（Web和Desktop共用）
│   ├── views/                  # 页面组件
│   ├── components/             # 公共组件
│   ├── composables/            # Vue3 Composables
│   │   └── useFileSystem.js    # 平台适配层 ⭐
│   ├── router/                 # 路由配置
│   └── assets/                 # 静态资源
│
├── dist/                       # Web构建输出
├── dist-electron/              # Electron构建输出
├── release/                    # 打包输出（.exe/.dmg/.AppImage）
│
├── electron-builder.json       # 打包配置
├── vite.config.js             # Vite配置（支持Electron）
└── package.json               # 项目配置
```

## 📖 开发文档

详细的开发指南请查看：[ELECTRON开发指南.md](./ELECTRON开发指南.md)

包含内容：
- Electron框架搭建说明
- 平台适配层使用方法
- 功能改造指南
- 常见问题解答

## 🎯 路线图

### 已完成 ✅
- [x] Electron框架搭建
- [x] 平台适配层（Web/Desktop自动切换）
- [x] PS批量套图功能改造（支持本地路径）
- [x] 艺术字样式系统（12种预设）

### 进行中 🚧
- [ ] 图片裁剪功能改造
- [ ] PDF合成功能改造

### 计划中 📋
- [ ] 规格图生成功能改造
- [ ] 自定义应用菜单
- [ ] 系统托盘
- [ ] 自动更新

## 🐛 常见问题

### Q: Electron窗口打不开？
A: 检查控制台日志，确保没有编译错误。运行 `npm run dev:electron` 查看输出。

### Q: 如何调试Electron？
A: 开发模式下会自动打开DevTools，也可以在代码中加 `console.log`。

### Q: 打包后体积很大？
A: Electron应用包含Chromium，基础大小~100MB。可以通过asar压缩、移除不需要的依赖来优化。

### Q: 如何判断当前环境？
A: 使用 `useFileSystem` 的 `isElectron.value` 判断。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

---

**开始使用：**
```bash
# Web模式
npm run dev

# Desktop模式
npm run dev:electron
```

享受强大的桌面端功能！🚀
