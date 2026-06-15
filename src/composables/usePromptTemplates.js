/**
 * 提示词模板管理
 * 持久化到 localStorage，切换路由/重启不丢失
 */
import { ref, watch } from 'vue';

const STORAGE_KEY = 'aiImagePromptTemplates';

// 模块级单例
const templates = ref([]);

// 初始化加载
const load = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) templates.value = JSON.parse(stored);
  } catch (e) {
    console.error('加载提示词模板失败', e);
  }
};

// 变化时自动保存
watch(templates, (val) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
  } catch (e) {
    console.error('保存提示词模板失败', e);
  }
}, { deep: true });

load();

export function usePromptTemplates() {
  /** 添加模板 */
  const addTemplate = (name, prompt) => {
    if (!name.trim() || !prompt.trim()) return;
    templates.value.unshift({
      id: Date.now(),
      name: name.trim(),
      prompt: prompt.trim(),
    });
  };

  /** 删除模板 */
  const removeTemplate = (id) => {
    templates.value = templates.value.filter(t => t.id !== id);
  };

  /** 更新模板 */
  const updateTemplate = (id, name, prompt) => {
    const t = templates.value.find(t => t.id === id);
    if (t) {
      t.name = name.trim();
      t.prompt = prompt.trim();
    }
  };

  return { templates, addTemplate, removeTemplate, updateTemplate };
}
