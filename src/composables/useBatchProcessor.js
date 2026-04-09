/**
 * 批量处理 Composable
 * 管理批量处理队列和进度
 */
import { ref, computed } from 'vue';
import JSZip from 'jszip';
import { downloadBlob } from '../utils/imageUtils.js';

export function useBatchProcessor() {
  // 任务队列
  const queue = ref([]);
  // 是否正在处理
  const isProcessing = ref(false);
  // 处理进度（0-1）
  const progress = ref(0);

  /**
   * 添加单个任务到队列
   * @param {Object} task - 任务对象
   */
  const addTask = (task) => {
    queue.value.push({
      id: Date.now() + Math.random(),
      status: 'pending', // pending, processing, done, error
      progress: 0,
      result: null,
      error: null,
      ...task
    });
  };

  /**
   * 批量添加任务
   * @param {Array} tasks - 任务数组
   */
  const addTasks = (tasks) => {
    tasks.forEach(task => addTask(task));
  };

  /**
   * 处理队列
   * @param {Function} processor - 处理函数，接收task参数，返回Promise
   * @param {Function} onProgress - 进度回调函数（可选）
   * @returns {Promise<Array>} 处理结果数组
   */
  const processQueue = async (processor, onProgress = null) => {
    if (isProcessing.value) {
      throw new Error('已有任务正在处理中');
    }

    isProcessing.value = true;
    progress.value = 0;

    const results = [];

    try {
      for (let i = 0; i < queue.value.length; i++) {
        const task = queue.value[i];

        // 跳过已完成的任务
        if (task.status === 'done') {
          results.push(task);
          continue;
        }

        // 更新任务状态
        task.status = 'processing';

        try {
          // 执行处理函数
          const result = await processor(task);
          task.result = result;
          task.status = 'done';
          results.push(task);
        } catch (error) {
          task.status = 'error';
          task.error = error.message;
          results.push(task);
        }

        // 更新进度
        progress.value = (i + 1) / queue.value.length;

        // 调用进度回调
        if (onProgress) {
          onProgress(progress.value, task);
        }
      }

      return results;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * 清空队列
   */
  const clearQueue = () => {
    if (isProcessing.value) {
      throw new Error('正在处理中，无法清空队列');
    }
    queue.value = [];
    progress.value = 0;
  };

  /**
   * 移除任务
   * @param {string|number} taskId - 任务ID
   */
  const removeTask = (taskId) => {
    if (isProcessing.value) {
      throw new Error('正在处理中，无法移除任务');
    }
    queue.value = queue.value.filter(t => t.id !== taskId);
  };

  /**
   * 导出结果为ZIP
   * @param {string} filename - ZIP文件名
   * @returns {Promise<void>}
   */
  const exportResultsAsZip = async (filename = 'processed-images.zip') => {
    // 筛选成功处理的任务
    const successTasks = queue.value.filter(t => t.status === 'done' && t.result);

    if (successTasks.length === 0) {
      throw new Error('没有成功处理的图片可供导出');
    }

    // 创建ZIP
    const zip = new JSZip();

    for (const task of successTasks) {
      const blob = task.result;
      const fileName = task.name || `image_${task.id}.png`;
      zip.file(fileName, blob);
    }

    // 生成ZIP Blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // 下载
    downloadBlob(zipBlob, filename);
  };

  // 计算属性：待处理任务数
  const pendingCount = computed(() => {
    return queue.value.filter(t => t.status === 'pending').length;
  });

  // 计算属性：已完成任务数
  const doneCount = computed(() => {
    return queue.value.filter(t => t.status === 'done').length;
  });

  // 计算属性：失败任务数
  const errorCount = computed(() => {
    return queue.value.filter(t => t.status === 'error').length;
  });

  return {
    queue,
    isProcessing,
    progress,
    addTask,
    addTasks,
    processQueue,
    clearQueue,
    removeTask,
    exportResultsAsZip,
    pendingCount,
    doneCount,
    errorCount
  };
}
