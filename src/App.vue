<script setup lang="ts">
import type { TranslationEntry } from '../extension/state'
import { computed, ref } from 'vue'
import { useLocale } from '../extension/composables'
import { vscodeApi } from './utils'

const translationEntry = ref<TranslationEntry>()
const description = ref<string>('')
const showReferences = ref(false)
const sourceLanguage = ref('')
// 根据预览图片中的语言列表
const locales = computed(() => {
  if (!translationEntry.value?.locales)
    return []

  // 获取所有可用的本地化代码
  const availableCodes = Object.keys(translationEntry.value!.locales)

  // 筛选出存在于当前翻译条目中的语言
  return availableCodes.map((code) => {
    const { locale: localeIdentifier } = useLocale(code)
    return {
      ...localeIdentifier!,
      originalCode: code,
    }
  })
})

// 保存翻译内容
async function saveTranslation(localeObjIdentifier: { code: string, originalCode: string }) {
  if (!translationEntry.value)
    return

  // 发送更新到VSCode扩展
  vscodeApi.postMessage({
    type: 'i18n-gettext.updateTranslation',
    data: {
      entry: JSON.stringify(translationEntry.value),
      locale: localeObjIdentifier.originalCode,
      value: translationEntry.value.locales[localeObjIdentifier.originalCode],
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

function isSourceLanguage(locale: string) {
  return locale === sourceLanguage.value
}

function getTranslationValue(locale: string) {
  const msgstr = translationEntry.value?.locales[locale]

  if (isSourceLanguage(locale) && !msgstr)
    return translationEntry.value?.id

  return msgstr
}

function translateByMachine(locale: { originalCode: string, code: string }) {
  vscodeApi.postMessage({
    type: 'i18n-gettext.translateByMachine',
    data: {
      entry: JSON.stringify(translationEntry.value),
      originalCode: locale.originalCode,
      targetCode: locale.code,
    },
  })
}

// 监听VSCode消息
vscodeApi.on('i18n-gettext.selectEntry', (entry: TranslationEntry & { sourceLanguage: string }) => {
  translationEntry.value = entry
  description.value = entry.msgctxt || ''
  sourceLanguage.value = entry.sourceLanguage
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
            :value="getTranslationValue(locale.originalCode)"
            class="translation-input"
            :placeholder="`${locale.name}翻译...`"
            @blur="saveTranslation(locale)"
            @change="e => translationEntry!.locales[locale.originalCode] = (e.target as HTMLInputElement).value"
          >
        </div>

        <div class="translation-actions">
          <div v-if="isSourceLanguage(locale.originalCode)" class="source-language-badge">
            source
          </div>
          <button v-if="!isSourceLanguage(locale.originalCode)" class="action-btn translate-btn" @click="translateByMachine(locale)">
            <span>机翻</span>
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

.source-language-badge {
  padding: 6px 12px;
  border-radius: 4px;
  background-color: rgba(240, 240, 240, 0.4);
  color: #666;
}

.translate-btn {
  background-color: #f0f0f0;
  color: #333;
  transition: background-color 0.2s;
}

.translate-btn:hover {
  color: #fff;
  background-color: #3e6fd3;
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
