<script setup lang="ts">
import type { TranslationEntry } from 'types'
import TranslateActions from '@/components/translation/TranslateActions.vue'
import { useTranslator } from '@/composables/useTranslator'
import { ref, watchEffect } from 'vue'
import TranslationEditor from '../components/translation/TranslationEditor.vue'
import { useTranslationEntry } from '../composables/useTranslationEntry'

const {
  translateByMachine,
  translateAllByMachine,
  translateSingleByAI,
  translateAllByAI,
} = useTranslator()
const { saveTranslation, goToReference } = useTranslationEntry()

const selectedModel = ref('')

watchEffect(() => {
  // 当切换条目时，如果有可用的AI模型，并且没有选择AI模型，将模型重置为第一个
  if (aiModels.value.length && !selectedModel.value) {
    selectedModel.value = `${aiModels.value[0].provider}:::${aiModels.value[0].modelId}`
    updateSelectedModel(selectedModel.value)
  }
})

function handleModelChange(modelId: string) {
  selectedModel.value = modelId
  updateSelectedModel(modelId)
}

// Translation related processing
function handleTranslateByMachine(locale: { originalCode: string, code: string }, entry: TranslationEntry) {
  translateByMachine(locale, entry)
}

function handleTranslateAllByMachine() {
  untranslatedEntries.value.forEach((entry) => {
    translateAllByMachine(sourceLanguage.value, entry)
  })
}

function handleTranslateAllByAI() {
  untranslatedEntries.value.forEach((entry) => {
    translateAllByAI(sourceLanguage.value, entry)
  })
}

function handleTranslateSingleByAI(locale: { originalCode: string, code: string }, entry: TranslationEntry) {
  translateSingleByAI(sourceLanguage.value, locale.originalCode, entry)
}

function handleClearHighlight(locale: string) {
  clearLanguageHighlight(locale)
  // 同时清除错误状态
  clearLanguageError(locale)
}
</script>

<template>
  <h1 class="text-2xl mb-4 fon">
    Batch Translator
  </h1>

  <div class="pb-30">
    <div
      v-for="entry in untranslatedEntries"
      :key="entry.id"
    >
      <h2 class="text-lg font-medium mb-4">
        "{{ entry.id }}"
      </h2>
      <TranslationEditor
        v-model:only-translate-untranslated="onlyTranslateUntranslated"
        :translation-entry="entry"
        :ai-models="aiModels"
        disable-actions
        :source-language="sourceLanguage"
        :is-a-i-translating="isAITranslating"
        :is-machine-translating="isMachineTranslating"
        :is-single-a-i-translating="isSingleAITranslating"
        :is-single-machine-translating="isSingleMachineTranslating"
        :current-translating-lang="currentTranslatingLang"
        :language-translating-state="languageTranslatingState"
        :is-language-recently-translated="isLanguageRecentlyTranslated"
        :has-language-error="hasLanguageError"
        :get-language-error="getLanguageError"
        @go-to-reference="goToReference"
        @save-translation="saveTranslation"
        @translate-by-machine="(locale) => handleTranslateByMachine(locale, entry)"
        @translate-single-by-a-i="(locale) => handleTranslateSingleByAI(locale, entry)"
        @update-selected-model="updateSelectedModel"
        @clear-highlight="handleClearHighlight"
      />

      <div class="h-1px my-8 bg-truegray-200 dark:bg-truegray-700" />
    </div>
  </div>

  <div
    class="fixed bottom-0 left-0 flex flex-col gap-3 w-full px-3 py-6 bg-white dark:bg-truegray-900 bg-op-90"
  >
    <!-- AI Model Selection -->
    <div v-if="aiModels.length" class="flex items-center justify-end gap-3 pb-2">
      <select
        v-model="selectedModel"
        class="w-fit text-sm bg-transparent border border-truegray-200 dark:border-truegray-700 rounded-md px-3 py-1.5 text-truegray-600 dark:text-truegray-400 focus:border-purple-300 focus:outline-none cursor-pointer"
        @change="(e) => handleModelChange((e.target as HTMLSelectElement).value)"
      >
        <option value="" disabled selected>
          Select AI Model
        </option>
        <option
          v-for="model in aiModels"
          :key="`${model.provider}:::${model.modelId}`"
          :value="`${model.provider}:::${model.modelId}`"
        >
          {{ model.provider }}:{{ model.modelId }}
        </option>
      </select>
    </div>
    <!-- Batch Actions -->
    <TranslateActions
      :enable-a-i="!!selectedModel"
      :is-a-i-translating="isAIBatchTranslating"
      :is-machine-translating="isMachineTranslating && !isSingleMachineTranslating"
      :is-any-item-translating="isSingleAITranslating || isSingleMachineTranslating"
      @translate-all-machine="handleTranslateAllByMachine"
      @translate-all-a-i="handleTranslateAllByAI"
    />
    <div class="flex justify-end gap-2">
      <input
        v-model="onlyTranslateUntranslated"
        type="checkbox"
      >
      <label>
        Only translate untranslated items
      </label>
    </div>
  </div>
</template>
