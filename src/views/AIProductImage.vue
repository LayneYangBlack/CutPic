<template>
  <div class="container mx-auto p-6 max-w-6xl">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">AI 产品图生成器</h1>
      <button
        @click="openSettings"
        class="px-3 py-1.5 flex items-center gap-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600 text-sm"
        title="API 配置"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h.09a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.09a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
        设置
      </button>
    </div>

    <!-- API 配置区域 -->
    <div v-if="!apiConfig.apiKey" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p class="text-yellow-700 text-sm mb-3 font-medium">⚠️ 请先配置 API Key 才能使用</p>
      <button @click="showSettings = true" class="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600">
        去配置
      </button>
    </div>

    <!-- Web 端 CORS 提示 -->
    <div v-if="!isElectron" class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <p class="text-blue-700 text-sm font-medium">ℹ️ Web 端提示</p>
      <p class="text-blue-600 text-xs mt-1">由于浏览器跨域限制，部分 API 中转服务在 Web 端可能无法使用。如遇到 "Failed to fetch" 错误，请使用桌面端（Electron）。</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-4">

        <!-- 提示词模板 -->
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-gray-700">提示词模板</h2>
            <button
              @click="showTemplateEditor = true; editingTemplate = null; templateForm.name = ''; templateForm.prompt = ''"
              class="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              新建模板
            </button>
          </div>

          <!-- 无模板提示 -->
          <p v-if="templates.length === 0" class="text-xs text-gray-400 text-center py-3">
            还没有模板，点击「新建模板」保存常用提示词
          </p>

          <!-- 模板列表 -->
          <div v-else class="space-y-2">
            <div
              v-for="t in templates"
              :key="t.id"
              class="flex items-center gap-2 p-2 border rounded-lg hover:border-blue-300 transition-colors"
              :class="selectedTemplateId === t.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200'"
            >
              <!-- 点击应用 -->
              <button
                @click="applyTemplate(t)"
                class="flex-1 text-left min-w-0"
              >
                <p class="text-sm font-medium text-gray-700 truncate">{{ t.name }}</p>
                <p class="text-xs text-gray-400 truncate">{{ t.prompt }}</p>
              </button>
              <!-- 编辑 -->
              <button
                @click="openEditTemplate(t)"
                class="flex-shrink-0 text-gray-300 hover:text-blue-500 p-1"
                title="编辑"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 13l6-6m-6 6H6v-3l9-9a2 2 0 012.828 0l.708.708A2 2 0 0118 7.828L9 16.656z"/></svg>
              </button>
              <!-- 删除 -->
              <button
                @click="removeTemplate(t.id)"
                class="flex-shrink-0 text-gray-300 hover:text-red-400 p-1"
                title="删除"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 🤖 AI 自动生成提示词 -->
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-gray-700">🤖 AI 自动流水线</h2>
            <!-- Ollama 状态指示 -->
            <span
              class="text-xs px-2 py-0.5 rounded-full"
              :class="ollamaAvailable ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'"
            >
              {{ ollamaAvailable ? '● Ollama 已连接' : '○ Ollama 未连接' }}
            </span>
          </div>

          <!-- Ollama 未连接提示 -->
          <div v-if="!ollamaAvailable" class="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 mb-3">
            需要本地运行 Ollama，确保已执行 <code class="bg-gray-200 px-1 rounded">ollama serve</code>
          </div>

          <div class="space-y-3">
            <!-- 产品描述（中文即可） -->
            <div>
              <label class="block text-xs text-gray-500 mb-1">产品描述（告诉 AI 是什么产品）</label>
              <textarea
                v-model="autoDesc"
                placeholder="例如：圆形马口铁扣式徽章，正面白色光滑，边缘细金属包边，可自定义印刷图案"
                class="w-full h-20 p-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-400"
              />
            </div>

            <!-- 参数行 -->
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="block text-xs text-gray-500 mb-1">使用模型</label>
                <select v-model="autoModel" class="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400">
                  <option value="qwen2.5:14b">qwen2.5:14b（质量更好）</option>
                  <option value="qwen2.5:7b">qwen2.5:7b（速度更快）</option>
                </select>
              </div>
              <div class="flex-1 flex items-end">
                <p class="text-xs text-gray-400">固定生成：3 批量场景 + 2 单品人物互动</p>
              </div>
            </div>

            <!-- 流式输出预览 -->
            <div v-if="autoStreamText" class="p-2 bg-gray-50 rounded-lg text-xs text-gray-500 max-h-24 overflow-y-auto whitespace-pre-wrap font-mono">{{ autoStreamText }}</div>

            <!-- 批次数量设置 -->
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500 whitespace-nowrap">连续生成</label>
              <input
                v-model.number="batchRunCount"
                type="number"
                min="1"
                max="20"
                class="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:border-blue-400"
              />
              <span class="text-xs text-gray-500">套</span>
              <!-- 批次进度 -->
              <span v-if="batchRunTotal > 0" class="text-xs text-purple-500 ml-2">
                第 {{ batchRunCurrent }} / {{ batchRunTotal }} 套
              </span>
            </div>

            <!-- 操作按钮 -->
            <div class="flex gap-2">
              <!-- 仅生成提示词 -->
              <button
                @click="runAutoPrompts"
                :disabled="!ollamaAvailable || !autoDesc.trim() || autoRunning"
                class="flex-1 py-2 text-sm rounded-lg border border-blue-400 text-blue-500 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {{ autoRunning && autoStep === 'prompts' ? '生成提示词中...' : '① 生成提示词' }}
              </button>
              <!-- 一键全流程：生成提示词 → 生图 → 下载 -->
              <button
                v-if="!autoRunning"
                @click="runBatchPipeline"
                :disabled="!ollamaAvailable || !autoDesc.trim() || isGenerating"
                class="flex-1 py-2 text-sm rounded-lg bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ⚡ 一键全流程（{{ batchRunCount }} 套）
              </button>
              <!-- 运行中的停止按钮 -->
              <button
                v-else
                @click="stopBatchPipeline"
                class="flex-1 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                {{ autoStepLabel }}（点击停止）
              </button>
            </div>
          </div>
        </div>

        <!-- 提示词输入 -->
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-gray-700">{{ batchMode ? '基础描述（每条都会拼接）' : '提示词' }}</h2>
            <span class="text-xs text-gray-400">{{ currentPrompt.length }}/2000</span>
          </div>
          <textarea
            v-model="currentPrompt"
            :placeholder="batchMode
              ? '输入产品固定描述，例如：A round button badge with glossy white front surface, no text, no writing'
              : '描述你想生成的产品图，例如：A round button badge on a denim jacket, studio lighting, no text'"
            class="w-full h-28 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-400"
            :maxlength="2000"
          />
          <!-- 批量场景 -->
          <div class="mt-3">
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs text-gray-500">
                {{ batchMode ? '场景变体（每行一个，自动拼接到基础描述后面）' : '批量模式' }}
              </label>
              <button
                @click="batchMode = !batchMode"
                class="text-xs text-blue-500 hover:text-blue-700"
              >
                {{ batchMode ? '切换单个模式' : '切换批量模式' }}
              </button>
            </div>
            <textarea
              v-if="batchMode"
              v-model="batchPrompts"
              placeholder="每行输入一个场景，会自动拼接到上方基础描述后&#10;例如：&#10;placed on a denim jacket, close-up shot&#10;lying flat on wooden table, top-down view&#10;pinned on a canvas backpack, lifestyle photo"
              class="w-full h-28 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-400"
            />
            <!-- 预览拼接结果（含防侵权词） -->
            <div v-if="batchMode && promptList.length > 0" class="mt-2 p-2 bg-gray-50 rounded-lg">
              <p class="text-xs text-gray-400 mb-1">实际发送预览（共 {{ promptList.length }} 条，含防侵权词）：</p>
              <p class="text-xs text-gray-600 line-clamp-2">{{ promptList[0] }}</p>
              <p v-if="promptList.length > 1" class="text-xs text-gray-400 mt-1">...还有 {{ promptList.length - 1 }} 条</p>
            </div>
          </div>
        </div>

        <!-- 参考图上传 -->
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-gray-700">参考图（可选）</h2>
            <button
              v-if="referenceImage"
              @click="clearReferenceImage"
              class="text-xs text-red-400 hover:text-red-600"
            >
              移除
            </button>
          </div>
          <!-- 图片预览 -->
          <div
            v-if="referenceImage"
            class="relative rounded-lg overflow-hidden border border-gray-200 mb-2"
          >
            <img :src="referenceImagePreview" alt="参考图" class="w-full h-40 object-contain bg-gray-50" />
            <div class="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
              已上传
            </div>
          </div>
          <!-- 上传区域 -->
          <div
            v-else
            @click="triggerImageUpload"
            @dragover.prevent
            @drop.prevent="handleImageDrop"
            class="border-2 border-dashed border-gray-200 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <svg class="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-sm text-gray-400">点击上传或拖入参考图</p>
            <p class="text-xs text-gray-300 mt-1">JPG / PNG / WebP，最大 10MB</p>
          </div>
          <input ref="imageInputRef" type="file" accept="image/*" class="hidden" @change="handleImageSelect" />
          <p v-if="referenceImage" class="text-xs text-gray-400 mt-2">
            上传参考图后，AI 将以此为基础进行创作（图生图模式）
          </p>
        </div>

        <!-- 生成参数 -->
        <div class="bg-white rounded-lg shadow p-4">
          <h2 class="font-semibold text-gray-700 mb-3">生成参数</h2>
          <div class="grid grid-cols-2 gap-3">
            <!-- 图片尺寸 -->
            <div>
              <label class="block text-xs text-gray-500 mb-1">尺寸</label>
              <select v-model="params.size" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                <option value="1024x1024">1024×1024（正方形）</option>
                <option value="1792x1024">1792×1024（横版）</option>
                <option value="1024x1792">1024×1792（竖版）</option>
              </select>
            </div>
            <!-- 每组张数 -->
            <div>
              <label class="block text-xs text-gray-500 mb-1">每组张数</label>
              <select v-model="params.imagesPerPrompt" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                <option :value="1">1 张</option>
                <option :value="2">2 张</option>
                <option :value="3">3 张</option>
                <option :value="4">4 张</option>
              </select>
            </div>
            <!-- 图片质量（仅文本生图） -->
            <div v-if="!referenceImage">
              <label class="block text-xs text-gray-500 mb-1">质量</label>
              <select v-model="params.quality" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                <option value="standard">标准</option>
                <option value="hd">高清（HD）</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 生成按钮 -->
        <button
          @click="handleGenerate"
          :disabled="isGenerating || !canGenerate"
          class="w-full py-3 rounded-lg font-semibold text-white transition-all"
          :class="isGenerating || !canGenerate
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 active:scale-95'"
        >
          <span v-if="isGenerating">{{ progressMessage || '生成中...' }}</span>
          <span v-else>
            {{ batchMode ? `批量生成（${promptList.length} 组）` : '开始生成' }}
          </span>
        </button>

        <!-- 进度条 -->
        <div v-if="isGenerating && batchMode && progressTotal > 1" class="bg-white rounded-lg shadow p-4">
          <div class="flex justify-between text-xs text-gray-500 mb-2">
            <span>批量生成进度</span>
            <span>{{ progressCurrent }}/{{ progressTotal }}</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-2">
            <div
              class="bg-blue-500 h-2 rounded-full transition-all"
              :style="{ width: `${progressTotal > 0 ? (progressCurrent / progressTotal) * 100 : 0}%` }"
            />
          </div>
        </div>
      </div>

      <!-- 右侧：结果展示 -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-700">
            生成结果
            <span v-if="results.length > 0" class="text-xs text-gray-400 font-normal ml-1">
              {{ results.filter(r => r.success).length }} 组 / {{ allGeneratedImages.length }} 张
            </span>
          </h2>
          <div class="flex gap-2">
            <button
              v-if="allGeneratedImages.length > 0"
              @click="downloadAll"
              class="text-xs text-blue-500 hover:text-blue-700 border border-blue-300 px-3 py-1 rounded-lg"
            >
              下载全部 zip
            </button>
            <button
              v-if="allGeneratedImages.length > 0"
              @click="clearResults"
              class="text-xs text-gray-400 hover:text-red-400 border border-gray-200 px-3 py-1 rounded-lg"
            >
              清空
            </button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="results.length === 0 && !isGenerating" class="h-80 flex flex-col items-center justify-center text-gray-300">
          <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p class="text-sm">在左侧输入提示词，开始生成</p>
        </div>

        <!-- 生成中（无结果时） -->
        <div v-if="isGenerating && results.length === 0" class="h-80 flex flex-col items-center justify-center">
          <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p class="text-sm text-gray-500">{{ progressMessage || '正在生成...' }}</p>
        </div>

        <!-- 分组结果列表 -->
        <div v-if="results.length > 0" class="space-y-4 max-h-[700px] overflow-y-auto pr-1">
          <div
            v-for="(result, idx) in results"
            :key="idx"
            class="border rounded-lg overflow-hidden"
            :class="result.success ? 'border-gray-100' : 'border-red-100'"
          >
            <!-- 组 header -->
            <div class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <!-- 组序号 -->
                <span class="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-medium">
                  {{ results.length - idx }}
                </span>
                <!-- 提示词截断展示 -->
                <p class="text-xs text-gray-500 truncate" :title="result.prompt">
                  {{ result.prompt }}
                </p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0 ml-2">
                <span
                  class="text-xs px-2 py-0.5 rounded-full"
                  :class="result.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'"
                >
                  {{ result.success ? `${result.images.length} 张` : '失败' }}
                </span>
                <!-- 每组下载按钮 -->
                <button
                  v-if="result.success && result.images.length > 0"
                  @click="downloadGroup(result, idx)"
                  class="text-xs text-blue-500 hover:text-blue-700 border border-blue-200 px-2 py-0.5 rounded"
                >
                  下载
                </button>
              </div>
            </div>

            <!-- 失败提示（详细错误） -->
            <div v-if="!result.success" class="p-3 bg-red-50">
              <div class="flex items-start justify-between gap-2 mb-1">
                <p class="text-xs font-semibold text-red-600">❌ 生成失败</p>
                <button
                  @click="copyError(result.error)"
                  class="text-xs text-red-500 hover:text-red-700 underline"
                >
                  复制错误
                </button>
              </div>
              <pre class="text-xs text-red-500 whitespace-pre-wrap break-all font-mono">{{ result.error }}</pre>
              <p class="text-xs text-red-400 mt-1 italic">提示词: {{ result.prompt }}</p>
            </div>

            <!-- 图片网格 -->
            <div
              v-if="result.success && result.images.length > 0"
              class="p-2 grid gap-2"
              :class="result.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'"
            >
              <div
                v-for="(img, imgIdx) in result.images"
                :key="imgIdx"
                class="relative group rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                @click="previewImage(img.dataUrl)"
              >
                <img
                  :src="img.dataUrl"
                  :alt="`图片 ${imgIdx + 1}`"
                  class="w-full h-40 object-cover"
                  loading="lazy"
                />
                <!-- Hover 遮罩 -->
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    @click.stop="downloadSingle(img.dataUrl, `product_${results.length - idx}_${imgIdx + 1}.png`)"
                    class="bg-white text-gray-700 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-100"
                  >
                    下载
                  </button>
                  <button
                    @click.stop="useAsReference(img.dataUrl)"
                    class="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-600"
                  >
                    参考图
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 生成中追加 loading -->
          <div v-if="isGenerating" class="border border-gray-100 rounded-lg p-4 flex items-center gap-3">
            <div class="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p class="text-sm text-gray-500">{{ progressMessage }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览弹窗 -->
    <div
      v-if="previewSrc"
      class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      @click="previewSrc = null"
    >
      <img
        :src="previewSrc"
        alt="预览"
        class="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
        @click.stop
      />
      <button
        @click="previewSrc = null"
        class="absolute top-4 right-4 text-white text-2xl w-10 h-10 flex items-center justify-center bg-black/40 rounded-full hover:bg-black/60"
      >
        ×
      </button>
    </div>

    <!-- 模板编辑弹窗 -->
    <div
      v-if="showTemplateEditor"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showTemplateEditor = false"
    >
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4">{{ editingTemplate ? '编辑模板' : '新建模板' }}</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">模板名称 <span class="text-red-400">*</span></label>
            <input
              v-model="templateForm.name"
              type="text"
              placeholder="例如：普通吧唧徽章"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">核心提示词 <span class="text-red-400">*</span></label>
            <textarea
              v-model="templateForm.prompt"
              placeholder="输入产品核心描述，例如：A round button badge with glossy white front surface and thin silver metal rim"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none h-28 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showTemplateEditor = false" class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">取消</button>
          <button
            @click="saveTemplate"
            :disabled="!templateForm.name || !templateForm.prompt"
            class="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- Settings 弹窗 -->
    <div
      v-if="showSettings"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showSettings = false"
    >
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4">API 配置</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">API Key <span class="text-red-400">*</span></label>
            <input
              v-model="settingsForm.apiKey"
              type="password"
              placeholder="sk-..."
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Base URL</label>
            <input
              v-model="settingsForm.baseUrl"
              type="url"
              placeholder="https://bmai.kun8.vip"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
              <label class="block text-sm text-gray-600 mb-1">模型</label>
              <select
                v-model="settingsForm.model"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="gpt-image-2">gpt-image-2（最新）</option>
                <option value="gpt-image-1.5">gpt-image-1.5</option>
                <option value="gpt-image-1">gpt-image-1</option>
              </select>
            </div>

          <!-- 下载目录 -->
          <div>
            <label class="block text-sm text-gray-600 mb-1">自动下载目录</label>
            <div class="flex gap-2">
              <input
                :value="settingsForm.downloadDir || '未设置（将使用系统下载目录）'"
                readonly
                class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50 truncate"
              />
              <button
                @click="selectDownloadDir"
                class="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-500 whitespace-nowrap"
              >
                选择目录
              </button>
              <button
                v-if="settingsForm.downloadDir"
                @click="settingsForm.downloadDir = ''"
                class="px-2 py-2 text-gray-400 hover:text-red-400"
                title="清除"
              >
                ×
              </button>
            </div>
            <p class="text-xs text-gray-400 mt-1">设置后，全流程自动生成时直接保存到此目录，无需手动选择</p>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button @click="showSettings = false" class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
            取消
          </button>
          <button
            @click="saveSettings"
            :disabled="!settingsForm.apiKey"
            class="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            保存
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useApiConfig } from '../composables/useApiConfig.js';
import { useImageGeneration } from '../composables/useImageGeneration.js';
import { usePromptTemplates } from '../composables/usePromptTemplates.js';
import { batchGenerateImages } from '../adapters/gptImage.js';
import { checkOllamaAvailable, generatePrompts, generateProductTitle } from '../adapters/ollama.js';
import { generateSizeWatermarks } from '../utils/watermarkUtils.js';
import { saveAs } from 'file-saver';

const { apiConfig, setApiKey, setBaseUrl, setModel, setDownloadDir } = useApiConfig();

// 便捷引用下载目录（全流程自动下载用）
const downloadDir = computed(() => apiConfig.value.downloadDir);
const { templates, addTemplate, removeTemplate, updateTemplate } = usePromptTemplates();

// 从单例 composable 取状态（切换路由不丢失）
const {
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
} = useImageGeneration();

// 是否 Electron 环境
const isElectron = typeof window !== 'undefined' && !!window.electron?.ai;

// ================== 组件内局部状态（这些不需要跨路由保留） ==================
const currentPrompt = ref('');
const batchPrompts = ref('');
const batchMode = ref(false);
const referenceImage = ref(null);
const referenceImagePreview = ref('');

const params = reactive({
  size: '1024x1024',
  imagesPerPrompt: 1,
  quality: 'standard',
});

const previewSrc = ref(null);
const showSettings = ref(false);
const imageInputRef = ref(null);

// 🤖 自动化流水线状态
const ollamaAvailable = ref(false);
const autoDesc = ref('');            // 产品描述（中文）
const autoCount = ref(5);            // 生成场景数
const autoModel = ref('qwen2.5:14b'); // Ollama 模型
const autoRunning = ref(false);      // 流水线运行中
const autoStep = ref('');            // 当前步骤：prompts / image / download
const autoStreamText = ref('');      // Ollama 流式输出预览

// 批次连续生成
const batchRunCount = ref(5);        // 连续生成几套
const batchRunCurrent = ref(0);      // 当前第几套
const batchRunTotal = ref(0);        // 本次运行总套数
const batchRunAbort = ref(false);    // 中止标志

const autoStepLabel = computed(() => {
  if (autoStep.value === 'prompts') return '① 生成提示词中...'
  if (autoStep.value === 'image') return '② 生图中...'
  if (autoStep.value === 'download') return '③ 打包下载...'
  return '⚡ 一键全流程'
});

// 页面加载时检测 Ollama
onMounted(async () => {
  ollamaAvailable.value = await checkOllamaAvailable();
});

// 模板编辑
const showTemplateEditor = ref(false);
const editingTemplate = ref(null);  // null = 新建，有值 = 编辑
const selectedTemplateId = ref(null); // 当前应用中的模板 id
const templateForm = reactive({ name: '', prompt: '' });

const settingsForm = reactive({
  apiKey: '',
  baseUrl: 'https://bmai.kun8.vip',
  model: 'gpt-image-2',
  downloadDir: '',
});

// ================== 计算属性 ==================

const promptList = computed(() => {
  // 防侵权后缀：不出现已知品牌、IP、版权内容
  const safeGuard = 'no brand logos, no known characters, no copyrighted symbols, no text, no writing, original design only';

  if (batchMode.value) {
    const base = currentPrompt.value.trim();
    const scenes = batchPrompts.value
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (scenes.length === 0) {
      return base ? [`${base}, ${safeGuard}`] : [];
    }
    return scenes.map(scene =>
      base ? `${base}, ${scene}, ${safeGuard}` : `${scene}, ${safeGuard}`
    );
  }

  const base = currentPrompt.value.trim();
  return base ? [`${base}, ${safeGuard}`] : [];
});

const canGenerate = computed(() => {
  return !!apiConfig.value.apiKey && promptList.value.length > 0;
});

// ================== 方法 ==================

// ================== 模板方法 ==================

/** 应用模板到输入框 */
const applyTemplate = (t) => {
  currentPrompt.value = t.prompt;
  selectedTemplateId.value = t.id;
};

/** 打开编辑模板弹窗 */
const openEditTemplate = (t) => {
  editingTemplate.value = t;
  templateForm.name = t.name;
  templateForm.prompt = t.prompt;
  showTemplateEditor.value = true;
};

/** 保存模板（新建或编辑） */
const saveTemplate = () => {
  if (!templateForm.name.trim() || !templateForm.prompt.trim()) return;
  if (editingTemplate.value) {
    updateTemplate(editingTemplate.value.id, templateForm.name, templateForm.prompt);
    // 如果当前应用的就是这个模板，同步更新输入框
    if (selectedTemplateId.value === editingTemplate.value.id) {
      currentPrompt.value = templateForm.prompt.trim();
    }
  } else {
    addTemplate(templateForm.name, templateForm.prompt);
  }
  showTemplateEditor.value = false;
  editingTemplate.value = null;
};

// ================== API 设置方法 ==================

const openSettings = () => {
  settingsForm.apiKey = apiConfig.value.apiKey;
  settingsForm.baseUrl = apiConfig.value.baseUrl;
  settingsForm.model = apiConfig.value.model;
  settingsForm.downloadDir = apiConfig.value.downloadDir || '';
  showSettings.value = true;
};

const saveSettings = () => {
  setApiKey(settingsForm.apiKey.trim());
  setBaseUrl(settingsForm.baseUrl.trim());
  setModel(settingsForm.model.trim());
  setDownloadDir(settingsForm.downloadDir);
  showSettings.value = false;
};

/** Electron 端选择下载目录 */
const selectDownloadDir = async () => {
  if (!isElectron) return;
  const result = await window.electron.dialog.selectFolder({ title: '选择自动下载目录' });
  if (result?.path) {
    settingsForm.downloadDir = result.path;
  }
};

const triggerImageUpload = () => {
  imageInputRef.value?.click();
};

const handleImageSelect = (e) => {
  const file = e.target.files?.[0];
  if (file) setReferenceImage(file);
  e.target.value = '';
};

const handleImageDrop = (e) => {
  const file = e.dataTransfer.files?.[0];
  if (file && file.type.startsWith('image/')) setReferenceImage(file);
};

const setReferenceImage = (file) => {
  referenceImage.value = file;
  const reader = new FileReader();
  reader.onload = (e) => { referenceImagePreview.value = e.target.result; };
  reader.readAsDataURL(file);
};

const clearReferenceImage = () => {
  referenceImage.value = null;
  referenceImagePreview.value = '';
};

const handleGenerate = async () => {
  if (!canGenerate.value || isGenerating.value) return;

  startGenerating(promptList.value.length);

  try {
    const newResults = await batchGenerateImages({
      prompts: promptList.value,
      referenceImage: referenceImage.value,
      apiKey: apiConfig.value.apiKey,
      baseUrl: apiConfig.value.baseUrl,
      model: apiConfig.value.model,
      imagesPerPrompt: params.imagesPerPrompt,
      size: params.size,
      quality: params.quality,
      onProgress: updateProgress,
    });

    appendResults(newResults);
  } catch (error) {
    console.error('生成失败:', error);
    appendError(promptList.value.join(' / '), error.message);
  } finally {
    finishGenerating();
  }
};

const downloadSingle = (dataUrl, filename = 'product.png') => {
  fetch(dataUrl).then(r => r.blob()).then(blob => saveAs(blob, filename));
};

/**
 * 打包并保存 zip
 * autoPipeline=true → 直接存到 downloadDir，不弹框（全流程自动用）
 * autoPipeline=false → Electron 弹另存为对话框，Web 直接下载
 */
const buildZipAndSave = async (successResults, zipName, autoPipeline = false) => {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  for (const group of successResults) {
    const folderName = group.prompt
      .replace(/[\\/:*?"<>|,]/g, ' ')
      .replace(/\s+/g, '_')
      .substring(0, 30)
      .trim() || 'group';

    const folder = zip.folder(folderName);
    for (let i = 0; i < group.images.length; i++) {
      const base64 = group.images[i].dataUrl.replace(/^data:image\/\w+;base64,/, '');
      folder.file(`${String(i + 1).padStart(2, '0')}.png`, base64, { base64: true });
    }
  }

  if (isElectron) {
    const base64Zip = await zip.generateAsync({ type: 'base64' });
    const useAutoPath = autoPipeline && !!downloadDir.value;
    // 把 downloadDir 传给主进程，自动存到指定目录
    const result = await window.electron.file.saveZip(base64Zip, zipName, useAutoPath, downloadDir.value);
    if (!result.success && !result.canceled) throw new Error(result.error);
    return result;
  } else {
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, zipName);
  }
};

/** 下载某一组（弹框选位置） */
const downloadGroup = async (result, idx) => {
  const folderName = result.prompt
    .replace(/[\\/:*?"<>|,]/g, ' ')
    .replace(/\s+/g, '_')
    .substring(0, 30)
    .trim() || `group_${idx + 1}`;
  await buildZipAndSave([result], `${folderName}.zip`, false);
};

/** 下载全部（弹框） */
const downloadAll = async () => {
  const successResults = results.value.filter(r => r.success && r.images.length > 0);
  if (!successResults.length) return;
  if (successResults.length === 1 && successResults[0].images.length === 1) {
    downloadSingle(successResults[0].images[0].dataUrl, 'product_1.png');
    return;
  }
  await buildZipAndSave(successResults, `ai_products_${Date.now()}.zip`, false);
};

const previewImage = (dataUrl) => { previewSrc.value = dataUrl; };

/** 复制错误信息到剪贴板 */
const copyError = (text) => {
  navigator.clipboard.writeText(text).catch(() => {});
};

const useAsReference = async (dataUrl) => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  setReferenceImage(new File([blob], 'generated.png', { type: 'image/png' }));
};

// ================== 🤖 自动化流水线 ==================

/** 仅生成提示词填入批量框，用户检查后再手动生图 */
const runAutoPrompts = async () => {
  if (!autoDesc.value.trim() || autoRunning.value) return;
  autoRunning.value = true;
  autoStep.value = 'prompts';
  autoStreamText.value = '';

  try {
    const { batch, single } = await generatePrompts({
      productDesc: autoDesc.value,
      corePrompt: currentPrompt.value.trim(),
      model: autoModel.value,
      onChunk: (_, full) => { autoStreamText.value = full },
    });

    // 批量场景填入批量框，单品场景追加
    batchMode.value = true;
    batchPrompts.value = [...batch, ...single].join('\n');
    autoStreamText.value = `✅ 批量场景 ${batch.length} 条，单品场景 ${single.length} 条，已填入批量框`;
  } catch (e) {
    console.error('Ollama 生成提示词失败:', e);
    autoStreamText.value = `❌ 失败: ${e.message}`;
  } finally {
    autoRunning.value = false;
    autoStep.value = '';
  }
};

/** 一键全流程：生成提示词 → 生图 → 打包下载到指定路径 */
const runFullPipeline = async () => {
  if (!autoDesc.value.trim() || autoRunning.value || isGenerating.value) return;
  autoRunning.value = true;
  autoStreamText.value = '';

  try {
    // Step 1: Ollama 生成提示词
    autoStep.value = 'prompts';
    const { batch, single } = await generatePrompts({
      productDesc: autoDesc.value,
      corePrompt: currentPrompt.value.trim(),
      model: autoModel.value,
      onChunk: (_, full) => { autoStreamText.value = full },
    });

    const allPrompts = [...batch, ...single];
    autoStreamText.value = `✅ 批量场景 ${batch.length} 条 + 单品场景 ${single.length} 条`;

    // 填入批量框供用户留存
    batchMode.value = true;
    batchPrompts.value = allPrompts.join('\n');

    // Step 2: 生图
    autoStep.value = 'image';
    startGenerating(allPrompts.length);

    const safeGuard = 'no brand logos, no known characters, no copyrighted symbols, no text, no writing, original design only';
    const base = currentPrompt.value.trim();
    const fullPrompts = allPrompts.map(p =>
      base ? `${base}, ${p}, ${safeGuard}` : `${p}, ${safeGuard}`
    );

    // 第 6 张：尺寸标注图（随机选一个规格）
    const sizeOptions = [
      { mm: '25mm', inch: '0.98inch' },
      { mm: '32mm', inch: '1.26inch' },
      { mm: '37mm', inch: '1.46inch' },
      { mm: '44mm', inch: '1.73inch' },
      { mm: '50mm', inch: '1.97inch' },
      { mm: '56mm', inch: '2.20inch' },
      { mm: '58mm', inch: '2.28inch' },
    ];
    const randomSizeObj = sizeOptions[Math.floor(Math.random() * sizeOptions.length)];
    const sizeChartPrompt = `Product size chart image: a single round button badge with colorful custom printed design, centered on pure white background. Black thin dimension lines with double-headed arrows on both sides of the badge indicating diameter ${randomSizeObj.mm}/${randomSizeObj.inch}. Technical drawing style measurement annotation, ruler markings along the dimension line, clean minimalist layout, professional product specification photo, no other objects, no brand logos`;
    fullPrompts.push(sizeChartPrompt);

    const newResults = await batchGenerateImages({
      prompts: fullPrompts,
      referenceImage: referenceImage.value,
      apiKey: apiConfig.value.apiKey,
      baseUrl: apiConfig.value.baseUrl,
      model: apiConfig.value.model,
      imagesPerPrompt: params.imagesPerPrompt,
      size: params.size,
      quality: params.quality,
      onProgress: updateProgress,
    });

    appendResults(newResults);
    finishGenerating();

    // Step 3: 水印 + 打包下载
    autoStep.value = 'download';
    const successResults = newResults.filter(r => r.success && r.images.length > 0);
    if (successResults.length > 0) {
      // 从批量场景结果中随机抽一张图做水印
      const batchResults = successResults.slice(0, batch.length).filter(r => r.images.length > 0);
      let watermarkImages = [];
      if (batchResults.length > 0) {
        const randomGroup = batchResults[Math.floor(Math.random() * batchResults.length)];
        const randomImg = randomGroup.images[Math.floor(Math.random() * randomGroup.images.length)];
        autoStreamText.value = '正在生成 7 种规格水印图...';
        watermarkImages = await generateSizeWatermarks(randomImg.dataUrl, 'bottom-right');
      }

      // 生成电商标题
      autoStreamText.value = '正在生成电商标题...';
      let productTitle = '';
      try {
        productTitle = await generateProductTitle({
          prompts: allPrompts,
          productDesc: autoDesc.value,
          model: autoModel.value,
        });
      } catch (e) {
        console.error('标题生成失败:', e);
        productTitle = ''; // 失败不阻断流程
      }

      // 打包 zip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // 5 张主图直接放根目录，不套文件夹（方便后续自动化）
      let imgIndex = 1;
      for (const group of successResults) {
        for (let i = 0; i < group.images.length; i++) {
          const base64 = group.images[i].dataUrl.replace(/^data:image\/\w+;base64,/, '');
          zip.file(`${String(imgIndex).padStart(2, '0')}.png`, base64, { base64: true });
          imgIndex++;
        }
      }

      // 规格水印图放单独文件夹
      if (watermarkImages.length > 0) {
        const wmFolder = zip.folder('size_watermarks');
        for (const wm of watermarkImages) {
          const safeName = wm.label.replace(/[\/]/g, '_');
          const base64 = wm.dataUrl.replace(/^data:image\/\w+;base64,/, '');
          wmFolder.file(`${safeName}.png`, base64, { base64: true });
        }
      }

      // 电商标题文本文件（只输出干净的标题文本）
      if (productTitle) {
        zip.file('title.txt', productTitle);
      }

      // 保存 zip
      const zipName = `ai_products_${Date.now()}.zip`;
      if (isElectron) {
        const base64Zip = await zip.generateAsync({ type: 'base64' });
        const useAutoPath = !!downloadDir.value;
        await window.electron.file.saveZip(base64Zip, zipName, useAutoPath, downloadDir.value);
      } else {
        const blob = await zip.generateAsync({ type: 'blob' });
        saveAs(blob, zipName);
      }
    }

    const savedTo = downloadDir.value ? `已保存到 ${downloadDir.value}` : '已下载';
    const wmNote = successResults.length > 0 ? '，含 7 张规格水印图' : '';
    autoStreamText.value = `🎉 完成！${successResults.length} 组 / ${successResults.reduce((s, r) => s + r.images.length, 0)} 张图片${wmNote}，${savedTo}`;
  } catch (e) {
    console.error('自动化流水线失败:', e);
    autoStreamText.value = `❌ 失败: ${e.message}`;
    finishGenerating();
  } finally {
    autoRunning.value = false;
    autoStep.value = '';
  }
};

/**
 * 批量连续执行全流程 N 套
 * 期间保持核心提示词、参考图、产品描述不变
 * 跑完自动停，可中途停止
 */
const runBatchPipeline = async () => {
  if (!autoDesc.value.trim() || autoRunning.value || isGenerating.value) return;

  const totalRuns = Math.max(1, Math.min(20, batchRunCount.value));
  batchRunTotal.value = totalRuns;
  batchRunCurrent.value = 0;
  batchRunAbort.value = false;

  for (let i = 0; i < totalRuns; i++) {
    if (batchRunAbort.value) {
      autoStreamText.value = `⏹ 已停止（完成 ${i}/${totalRuns} 套）`;
      break;
    }

    batchRunCurrent.value = i + 1;
    autoStreamText.value = `🔄 正在执行第 ${i + 1}/${totalRuns} 套...`;

    try {
      await runFullPipeline();
    } catch (e) {
      console.error(`第 ${i + 1} 套失败:`, e);
      // 单套失败不中断整个批次，继续下一套
    }

    // 套与套之间稍等一下，避免接口限流
    if (i < totalRuns - 1 && !batchRunAbort.value) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // 全部完成后自动清空
  batchRunTotal.value = 0;
  batchRunCurrent.value = 0;
  if (!batchRunAbort.value) {
    autoStreamText.value = `🎉 批次全部完成！共生成 ${totalRuns} 套`;
  }
};

/** 停止批量任务（当前这套跑完后不再继续） */
const stopBatchPipeline = () => {
  batchRunAbort.value = true;
  autoStreamText.value = '⏸ 正在停止，等待当前套完成...';
};
</script>
