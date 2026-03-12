/**
 * Canvas历史记录 Composable
 * 实现撤销/重做功能
 */
import { ref, computed } from 'vue';

export function useCanvasHistory(maxHistory = 20) {
  // 历史记录栈
  const history = ref([]);
  // 当前索引
  const currentIndex = ref(-1);

  /**
   * 保存Canvas状态
   * @param {string} canvasDataUrl - Canvas的DataURL
   */
  const saveState = (canvasDataUrl) => {
    // 删除当前索引之后的所有历史记录
    history.value = history.value.slice(0, currentIndex.value + 1);

    // 添加新状态
    history.value.push(canvasDataUrl);

    // 限制历史记录数量
    if (history.value.length > maxHistory) {
      history.value.shift();
    } else {
      currentIndex.value++;
    }
  };

  /**
   * 撤销
   * @returns {string|null} 上一个状态的DataURL，如果无法撤销则返回null
   */
  const undo = () => {
    if (currentIndex.value > 0) {
      currentIndex.value--;
      return history.value[currentIndex.value];
    }
    return null;
  };

  /**
   * 重做
   * @returns {string|null} 下一个状态的DataURL，如果无法重做则返回null
   */
  const redo = () => {
    if (currentIndex.value < history.value.length - 1) {
      currentIndex.value++;
      return history.value[currentIndex.value];
    }
    return null;
  };

  /**
   * 清空历史记录
   */
  const clearHistory = () => {
    history.value = [];
    currentIndex.value = -1;
  };

  /**
   * 获取当前状态
   * @returns {string|null} 当前状态的DataURL
   */
  const getCurrentState = () => {
    if (currentIndex.value >= 0 && currentIndex.value < history.value.length) {
      return history.value[currentIndex.value];
    }
    return null;
  };

  // 计算属性：是否可以撤销
  const canUndo = computed(() => currentIndex.value > 0);

  // 计算属性：是否可以重做
  const canRedo = computed(() => currentIndex.value < history.value.length - 1);

  return {
    saveState,
    undo,
    redo,
    clearHistory,
    getCurrentState,
    canUndo,
    canRedo
  };
}
