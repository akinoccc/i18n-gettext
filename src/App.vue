<script setup lang="ts">
import { onMounted } from 'vue'
import TranslationEditor from './components/translation/TranslationEditor.vue'
import { useAITranslation } from './composables/useAITranslation'
import { useTranslationEntry } from './composables/useTranslationEntry'

const {
  translationEntry,
  sourceLanguage,
  saveTranslation,
  goToReference,
  setupMessageListeners: setupTranslationListeners,
} = useTranslationEntry()

const {
  aiModels,
  isTranslating,
  error,
  updateSelectedModel,
  translateByMachine,
  translateAllByMachine,
  translateAllByAI,
  setupMessageListeners: setupAIListeners,
} = useAITranslation()

onMounted(() => {
  // Set up message listeners
  setupTranslationListeners()
  setupAIListeners()
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
