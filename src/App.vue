<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { WebViewMessageType } from '../constants'
import TranslationEditor from './components/translation/TranslationEditor.vue'
import { useAITranslation } from './composables/useAITranslation'
import { useTranslationEntry } from './composables/useTranslationEntry'
import { vscodeApi } from './utils'

const {
  translationEntry,
  sourceLanguage,
  saveTranslation,
  goToReference,
  setupMessageListeners: setupTranslationListeners,
} = useTranslationEntry()

const {
  aiModels,
  isAITranslating,
  isMachineTranslating,
  isAIBatchTranslating,
  isSingleAITranslating,
  isSingleMachineTranslating,
  currentTranslatingLang,
  languageTranslatingState,
  isLanguageRecentlyTranslated,
  hasLanguageError,
  getLanguageError,
  clearLanguageHighlight,
  clearLanguageError,
  resetAllTranslationStates,
  error,
  updateSelectedModel,
  translateByMachine,
  translateAllByMachine,
  translateSingleByAI,
  translateAllByAI,
  setupMessageListeners: setupAIListeners,
  onlyTranslateUntranslated,
  updateOnlyTranslateUntranslated,
} = useAITranslation()

// 检测操作系统类型，用于显示正确的快捷键
const isMac = computed(() => navigator.platform.includes('Mac'))

// Handle keyboard shortcuts
function handleKeyDown(event: KeyboardEvent) {
  // Check for Ctrl+Enter or Cmd+Enter
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    // Send message to extension to navigate to next untranslated entry
    vscodeApi.postMessage({
      type: WebViewMessageType.NEXT_UNTRANSLATED_ENTRY,
      data: null,
    })
  }
}

onMounted(() => {
  // Send ready message to extension
  vscodeApi.postMessage({
    type: WebViewMessageType.WEBVIEW_READY,
    data: null,
  })

  // Set up message listeners
  setupTranslationListeners()
  setupAIListeners()

  // Add keyboard event listener
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  // Remove keyboard event listener
  window.removeEventListener('keydown', handleKeyDown)
})

// Translation related processing
function handleTranslateByMachine(locale: { originalCode: string, code: string }) {
  translateByMachine(locale)
}

function handleTranslateAllByMachine() {
  translateAllByMachine(sourceLanguage.value)
}

function handleTranslateAllByAI() {
  translateAllByAI(sourceLanguage.value)
}

function handleTranslateSingleByAI(locale: { originalCode: string, code: string }) {
  translateSingleByAI(sourceLanguage.value, locale.originalCode)
}

function handleClearHighlight(locale: string) {
  clearLanguageHighlight(locale)
  // 同时清除错误状态
  clearLanguageError(locale)
}

// 手动重置所有翻译状态
function resetTranslationStates() {
  resetAllTranslationStates()
}
</script>

<template>
  <main class="p-4 font-sans">
    <div v-if="error" class="mb-4 p-2 bg-red-100 text-red-700 rounded">
      {{ error }}
    </div>

    <header v-if="translationEntry" class="mb-5">
      <div class="flex items-center gap-2">
        <h1 class="text-lg font-semibold m-0">
          "{{ translationEntry?.id }}"
        </h1>
        <div v-if="translationEntry?.msgctxt" class="bg-truegray-100 text-truegray-600 px-2 py-1 rounded dark:bg-truegray-800 dark:text-truegray-400">
          {{ translationEntry?.msgctxt }}
        </div>
      </div>
    </header>

    <TranslationEditor
      v-model:only-translate-untranslated="onlyTranslateUntranslated"
      :translation-entry="translationEntry"
      :ai-models="aiModels"
      :source-language="sourceLanguage"
      :is-a-i-translating="isAITranslating"
      :is-machine-translating="isMachineTranslating"
      :is-a-i-batch-translating="isAIBatchTranslating"
      :is-single-a-i-translating="isSingleAITranslating"
      :is-single-machine-translating="isSingleMachineTranslating"
      :current-translating-lang="currentTranslatingLang"
      :language-translating-state="languageTranslatingState"
      :is-language-recently-translated="isLanguageRecentlyTranslated"
      :has-language-error="hasLanguageError"
      :get-language-error="getLanguageError"
      @go-to-reference="goToReference"
      @save-translation="saveTranslation"
      @translate-by-machine="handleTranslateByMachine"
      @translate-all-by-machine="handleTranslateAllByMachine"
      @translate-all-by-a-i="handleTranslateAllByAI"
      @translate-single-by-a-i="handleTranslateSingleByAI"
      @update-selected-model="updateSelectedModel"
      @clear-highlight="handleClearHighlight"
    />

    <!-- Keyboard Shortcut Tip -->
    <div class="flex items-center justify-center mt-16 gap-2 px-3 py-2 text-sm text-gray-400">
      <kbd class="px-2 py-1 bg-white dark:bg-truegray-900 border border-truegray-300 dark:border-truegray-700 rounded-md shadow-sm font-mono text-xs text-truegray-400 dark:text-truegray-400">
        {{ isMac ? '⌘' : 'Ctrl' }} + Enter
      </kbd>
      <span>to navigate to next untranslated item</span>
    </div>
  </main>
</template>
