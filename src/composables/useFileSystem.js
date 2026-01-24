/**
 * 平台适配层 - 统一的文件系统API
 * 自动检测环境（Web/Electron），选择最优方案
 */
import { ref, computed } from 'vue';
import { saveAs } from 'file-saver';

export function useFileSystem() {
  // 检测是否为Electron环境
  const isElectron = ref(typeof window !== 'undefined' && !!window.electron);
  const platform = ref(null);

  // 初始化平台信息
  if (isElectron.value) {
    window.electron.platform.getInfo().then(info => {
      platform.value = info;
    });
  }

  /**
   * 选择单个文件
   * Desktop: 原生文件对话框
   * Web: 创建input[type=file]元素
   */
  const selectFile = async (options = {}) => {
    if (isElectron.value) {
      // Desktop模式：使用原生对话框
      const result = await window.electron.dialog.selectFile({
        title: options.title || '选择文件',
        filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
      });

      if (!result.success) {
        return null;
      }

      return {
        path: result.path,
        name: result.name,
      };
    } else {
      // Web模式：使用input元素
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        if (options.accept) {
          input.accept = options.accept;
        }

        input.onchange = (e) => {
          const file = e.target.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }

          resolve({
            file: file,
            name: file.name,
            size: file.size,
          });
        };

        input.click();
      });
    }
  };

  /**
   * 选择多个文件
   */
  const selectFiles = async (options = {}) => {
    if (isElectron.value) {
      const result = await window.electron.dialog.selectFiles({
        title: options.title || '选择文件',
        filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
      });

      if (!result.success) {
        return [];
      }

      return result.paths.map(p => ({ path: p }));
    } else {
      // Web模式
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        if (options.accept) {
          input.accept = options.accept;
        }

        input.onchange = (e) => {
          const files = Array.from(e.target.files || []);
          resolve(files.map(f => ({ file: f, name: f.name, size: f.size })));
        };

        input.click();
      });
    }
  };

  /**
   * 选择文件夹
   * Desktop: 可以选择文件夹
   * Web: 使用webkitdirectory
   */
  const selectFolder = async (options = {}) => {
    if (isElectron.value) {
      const result = await window.electron.dialog.selectFolder({
        title: options.title || '选择文件夹',
      });

      if (!result.success) {
        return null;
      }

      return {
        path: result.path,
        name: result.name,
      };
    } else {
      // Web模式：使用webkitdirectory
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;

        input.onchange = (e) => {
          const files = Array.from(e.target.files || []);
          if (files.length === 0) {
            resolve(null);
            return;
          }

          // 获取文件夹名称
          const folderName = files[0].webkitRelativePath.split('/')[0];
          resolve({
            files: files,
            name: folderName,
          });
        };

        input.click();
      });
    }
  };

  /**
   * 读取图片
   * Desktop: 支持本地路径 (C:\xxx\image.jpg)
   * Web: 只支持URL或File对象
   */
  const readImage = async (source) => {
    if (isElectron.value && typeof source === 'string') {
      // Desktop模式：直接读取本地路径
      const result = await window.electron.file.readImage(source);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data; // 返回base64 DataURL
    } else if (source instanceof File) {
      // Web模式：读取File对象
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(source);
      });
    } else if (typeof source === 'string') {
      // Web模式：直接返回URL
      return source;
    } else {
      throw new Error('不支持的图片源类型');
    }
  };

  /**
   * 批量读取图片文件夹
   * Desktop独有功能
   */
  const readImageFolder = async (folderPath) => {
    if (!isElectron.value) {
      throw new Error('批量读取文件夹功能仅在桌面端支持');
    }

    const result = await window.electron.file.readImageFolder(folderPath);

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.images;
  };

  /**
   * 保存文件
   * Desktop: 用户选择保存位置
   * Web: 浏览器下载
   */
  const saveFile = async (blob, filename) => {
    if (isElectron.value) {
      // Desktop模式：让用户选择保存位置
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Array.from(new Uint8Array(arrayBuffer));

      const result = await window.electron.file.save(buffer, filename);

      if (!result.success && !result.canceled) {
        throw new Error(result.error);
      }

      return result;
    } else {
      // Web模式：使用file-saver
      saveAs(blob, filename);
      return { success: true };
    }
  };

  /**
   * 读取Excel文件
   * Desktop: 性能更优（直接fs.readFile）
   * Web: 使用FileReader
   */
  const readExcel = async (source) => {
    if (isElectron.value && typeof source === 'string') {
      // Desktop模式：直接读取路径
      const result = await window.electron.file.readExcel(source);

      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        data: result.data,
        columns: result.columns,
      };
    } else {
      // Web模式：使用FileReader + xlsx
      const XLSX = await import('xlsx');

      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            resolve({
              data: jsonData,
              columns: jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
            });
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = reject;
        reader.readAsArrayBuffer(source);
      });
    }
  };

  /**
   * 写入Excel文件
   * Desktop: 直接保存
   * Web: 下载
   */
  const writeExcel = async (data, filename = 'export.xlsx') => {
    if (isElectron.value) {
      // Desktop模式：直接保存
      const result = await window.electron.file.writeExcel(data, filename);

      if (!result.success && !result.canceled) {
        throw new Error(result.error);
      }

      return result;
    } else {
      // Web模式：下载
      const XLSX = await import('xlsx');

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      XLSX.writeFile(wb, filename);

      return { success: true };
    }
  };

  return {
    // 环境信息
    isElectron,
    platform,
    isWeb: computed(() => !isElectron.value),

    // 文件选择
    selectFile,
    selectFiles,
    selectFolder,

    // 文件读写
    readImage,
    readImageFolder,
    saveFile,

    // Excel操作
    readExcel,
    writeExcel,
  };
}
