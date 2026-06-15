import { ref, watch } from 'vue';

// localStorage key
const API_CONFIG_KEY = 'aiImageApiConfig';

// 响应式配置对象
const apiConfig = ref({
  apiKey: '',
  baseUrl: 'https://bmai.kun8.vip',
  model: 'gpt-image-2',
  downloadDir: '', // 全流程自动下载目录（Electron 专用）
});

/**
 * 从 localStorage 加载配置
 */
const loadApiConfig = () => {
  try {
    const stored = localStorage.getItem(API_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 合并配置，保留默认值
      apiConfig.value = { ...apiConfig.value, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load API config from localStorage', e);
  }
};

/**
 * 监听配置变化，自动保存到 localStorage
 */
watch(apiConfig, (newConfig) => {
  try {
    localStorage.setItem(API_CONFIG_KEY, JSON.stringify(newConfig));
  } catch (e) {
    console.error('Failed to save API config to localStorage', e);
  }
}, { deep: true });

// 初始化时加载配置
loadApiConfig();

/**
 * API 配置管理 Hook
 * 用于管理 AI 图像生成 API 的配置（API Key、Base URL、模型等）
 */
export function useApiConfig() {
  /**
   * 更新 API Key
   * @param {string} key - 新的 API Key
   */
  const setApiKey = (key) => {
    apiConfig.value.apiKey = key;
  };

  /**
   * 更新 Base URL
   * @param {string} url - 新的 Base URL
   */
  const setBaseUrl = (url) => {
    apiConfig.value.baseUrl = url;
  };

  /**
   * 更新模型
   * @param {string} model - 新的模型名称
   */
  const setModel = (model) => {
    apiConfig.value.model = model;
  };

  /** 设置自动下载目录 */
  const setDownloadDir = (dir) => {
    apiConfig.value.downloadDir = dir;
  };

  /**
   * 检查配置是否完整
   */
  const isConfigured = () => {
    return !!apiConfig.value.apiKey && !!apiConfig.value.baseUrl;
  };

  const clearConfig = () => {
    apiConfig.value = {
      apiKey: '',
      baseUrl: 'https://bmai.kun8.vip',
      model: 'gpt-image-2',
      downloadDir: '',
    };
  };

  return {
    apiConfig,
    setApiKey,
    setBaseUrl,
    setModel,
    setDownloadDir,
    isConfigured,
    clearConfig,
  };
}
