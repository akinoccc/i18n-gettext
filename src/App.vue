<script setup lang="ts">
import { onMounted } from 'vue'
import { useAITranslation } from './composables/useAITranslation'
import { useTranslationEntry } from './composables/useTranslationEntry'
import TranslationEditor from './components/translation/TranslationEditor.vue'

// 使用组合式函数
const {
  translationEntry,
  sourceLanguage,
  saveTranslation,
  goToReference,
  setupMessageListeners: setupTranslationListeners,
} = useTranslationEntry()

const {
  aiModels,
  selectedAIModel,
  isTranslating,
  error,
  initAIModelOptions,
  updateSelectedModel,
  translateByMachine,
  translateAllByMachine,
  translateAllByAI,
  setupMessageListeners: setupAIListeners,
} = useAITranslation()

// 应用初始化
onMounted(() => {
  // 设置消息监听
  setupTranslationListeners()
  setupAIListeners(translationEntry.value)
  
  // 初始化AI模型
  initAIModelOptions()
})

// 翻译相关处理
function handleTranslateByMachine(locale: { originalCode: string, code: string }) {
  translateByMachine(translationEntry.value, locale)
}

function handleTranslateAllByMachine() {
  translateAllByMachine(translationEntry.value, sourceLanguage.value)
}

function handleTranslateAllByAI() {
  translateAllByAI(translationEntry.value, sourceLanguage.value)
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
        <div v-if="translationEntry?.msgctxt" class="bg-gray-100 text-gray-600 px-2 py-1 rounded">
          {{ translationEntry?.msgctxt }}
        </div>
      </div>
    </header>

    <TranslationEditor
      :translation-entry="translationEntry"
      :ai-models="aiModels"
      :source-language="sourceLanguage"
      :is-translating="isTranslating"
      @go-to-reference="goToReference"
      @save-translation="saveTranslation"
      @translate-by-machine="handleTranslateByMachine"
      @translate-all-by-machine="handleTranslateAllByMachine"
      @translate-all-by-a-i="handleTranslateAllByAI"
      @update-selected-model="updateSelectedModel"
    />
  </main>
</template>


