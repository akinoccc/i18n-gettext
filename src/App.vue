<script setup lang="ts">
import type { TranslationEntry } from '../extension/state'
import { computed, ref } from 'vue'
import { vscodeApi } from './utils'

const translationEntry = ref<TranslationEntry>()
const description = ref<string>('')
const showTranslationPanel = ref(true)
const showReferences = ref(false)

// 根据预览图片中的语言列表
const locales = computed(() => {
  if (!translationEntry.value?.locales)
    return []

  // 构建本地化语言列表，确保显示顺序与图片一致
  const localesMap = [
    { code: 'zh_CN', flag: '🇨🇳', name: '中文(简体)' },
    { code: 'en', flag: '🇺🇸', name: '英文' },
    { code: 'zh_HK', flag: '🇭🇰', name: '中文(香港)' },
    { code: 'zh_TW', flag: '🇹🇼', name: '中文(台湾)' },
  ]

  return localesMap.filter(locale =>
    Object.keys(translationEntry.value!.locales).includes(locale.code),
  )
})

// 保存翻译内容
async function saveTranslation(localeCode: string, value: string) {
  if (!translationEntry.value)
    return

  // 更新本地数据
  translationEntry.value.locales[localeCode] = value

  // 发送更新到VSCode扩展
  vscodeApi.postMessage({
    type: 'i18n-gettext.updateTranslation',
    data: {
      entry: JSON.stringify(translationEntry.value),
      locale: localeCode,
      value,
    },
  })
}

// 切换引用列表显示状态
function toggleReferences() {
  showReferences.value = !showReferences.value
}

// 跳转到引用位置
function goToReference(reference: string) {
  vscodeApi.postMessage({
    type: 'i18n-gettext.goToReference',
    data: {
      reference,
    },
  })
}

// 监听VSCode消息
vscodeApi.on('i18n-gettext.selectEntry', (entry: TranslationEntry) => {
  translationEntry.value = entry
  description.value = entry.msgctxt || ''
})
</script>

<template>
  <main class="translation-editor">
    <header class="editor-header">
      <div class="title-section">
        <h1 class="id-display">
          "{{ translationEntry?.id }}"
        </h1>
        <div v-if="translationEntry?.msgctxt" class="context">
          {{ translationEntry?.msgctxt }}
        </div>
      </div>

      <!-- 引用部分 -->
      <div v-if="translationEntry?.references?.length" class="references-container">
        <div class="references-header" @click="toggleReferences">
          <span class="arrow" :class="{ 'arrow-down': showReferences }">▶</span>
          <span>引用位置 ({{ translationEntry.references.length }})</span>
        </div>
        <div class="references-list" :class="{ 'references-list-show': showReferences }">
          <div
            v-for="(reference, index) in translationEntry.references"
            :key="index"
            class="reference-item"
            @click="goToReference(reference)"
          >
            <span class="reference-icon">📄</span>
            <span class="reference-path">{{ reference }}</span>
          </div>
        </div>
      </div>
    </header>

    <div v-if="translationEntry" class="translations-container">
      <div
        v-for="locale in locales"
        :key="locale.code"
        class="translation-row"
      >
        <div class="locale-info">
          <span class="flag">{{ locale.flag }}</span>
          <span class="locale-code">{{ locale.code }}</span>
        </div>

        <div class="translation-content">
          <input
            v-model="translationEntry.locales[locale.code]"
            class="translation-input"
            :placeholder="`${locale.name}翻译...`"
            @blur="saveTranslation(locale.code, translationEntry.locales[locale.code])"
          >
        </div>

        <div class="translation-actions">
          <button class="action-btn translate-btn">
            <span>机器翻译</span>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>请选择一个翻译条目</p>
    </div>
  </main>
</template>

<style scoped>
.translation-editor {
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.editor-header {
  margin-bottom: 20px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.id-display {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.context {
  padding: 4px 8px;
  background-color: #f0f0f0;
  border-radius: 8px;
  font-size: 12px;
  color: #6374e0;
}

/* 引用相关样式 */
.references-container {
  margin-top: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.references-header {
  padding: 10px 12px;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.arrow {
  margin-right: 4px;
  font-size: 12px;
  transition: transform 0.2s ease;
}

.arrow-down {
  transform: rotate(90deg);
}

.references-list {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.2s ease;
}

.references-list-show {
  max-height: 200px;
  overflow-y: auto;
}

.reference-item {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-top: 1px solid #e0e0e0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.reference-item:hover {
  background-color: #f0f0f0;
}

.reference-icon {
  font-size: 14px;
}

.reference-path {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #0366d6;
}

.translations-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.translation-row {
  display: flex;
  align-items: center;
  padding-bottom: 2px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.locale-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 60px;
}

.flag {
  font-size: 20px;
}

.locale-code {
  font-size: 12px;
}

.translation-content {
  flex: 1;
  padding-right: 24px;
}

.translation-input {
  width: 100%;
  border: none;
  resize: vertical;
  padding: 8px;
  border-radius: 8px;
  font-size: 14px;
}

.translation-actions {
  display: flex;
  padding: 8px;
  gap: 8px;
  align-items: flex-start;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.translate-btn {
  background-color: #f0f0f0;
  color: #333;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  background-color: #f9f9f9;
  border-radius: 4px;
  color: #666;
}
</style>
