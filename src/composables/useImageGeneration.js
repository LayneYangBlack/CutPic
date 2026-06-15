/**
 * AI 图像生成状态管理
 * 模块级单例，切换路由后状态不丢失
 */
import { ref, computed } from 'vue';

// ====== 模块级单例状态（组件卸载后依然保留） ======

// 生成结果列表
const results = ref([]);

// 是否正在生成
const isGenerating = ref(false);

// 进度信息
const progressMessage = ref('');
const progressCurrent = ref(0);
const progressTotal = ref(0);

// ====== 导出 Hook ======

export function useImageGeneration() {
  // 所有生成成功的图片（扁平化）
  const allGeneratedImages = computed(() =>
    results.value.filter(r => r.success).flatMap(r => r.images)
  );

  /** 开始生成 */
  const startGenerating = (total) => {
    isGenerating.value = true;
    progressMessage.value = '准备中...';
    progressCurrent.value = 0;
    progressTotal.value = total;
  };

  /** 更新进度 */
  const updateProgress = (progress) => {
    progressMessage.value = progress.message || '';
    if (progress.current != null) progressCurrent.value = progress.current;
    if (progress.total != null) progressTotal.value = progress.total;
  };

  /** 追加结果（新的在前） */
  const appendResults = (newResults) => {
    results.value = [...newResults, ...results.value];
  };

  /** 追加单条失败记录 */
  const appendError = (prompt, error) => {
    results.value = [
      { prompt, images: [], success: false, error },
      ...results.value,
    ];
  };

  /** 完成生成 */
  const finishGenerating = () => {
    isGenerating.value = false;
    progressMessage.value = '';
  };

  /** 清空结果 */
  const clearResults = () => {
    results.value = [];
  };

  return {
    results,
    isGenerating,
    progressMessage,
    progressCurrent,
    progressTotal,
    allGeneratedImages,
    startGenerating,
    updateProgress,
    appendResults,
    appendError,
    finishGenerating,
    clearResults,
  };
}
