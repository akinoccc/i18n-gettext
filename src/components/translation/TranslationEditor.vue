<script setup lang="ts">
import type { LocaleIdentifier, ModelInfo, TranslationEntry } from 'types'
import { computed } from 'vue'
import AITranslatePanel from './AITranslatePanel.vue'
import ReferencesList from './ReferencesList.vue'
import TranslationItem from './TranslationItem.vue'

interface Props {
  translationEntry: TranslationEntry
  aiModels: ModelInfo[]
  sourceLanguage: string
  isTranslating: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  goToReference: [reference: string]
  saveTranslation: [locale: string, value: string]
  translateByMachine: [locale: LocaleIdentifier & { originalCode: string }]
  translateAllByMachine: []
  translateAllByAI: []
  updateSelectedModel: [modelId: string]
}>()

// Calculate displayed localization list
const locales = computed(() => {
  if (!props.translationEntry?.locales)
    return []

  // Get all available locale codes
  const availableCodes = Object.keys(props.translationEntry!.locales)

  // Create language identifier object using localization tools
  return availableCodes.map((code) => {
    // Here we assume we've imported useLocale and use it to get language info
    // For simplicity, directly create language identifier object
    return {
      name: code === 'en' ? 'English' : code === 'zh' ? '中文' : code,
      code,
      flag: code === 'en' ? '🇺🇸' : code === 'zh' ? '🇨🇳' : '🏳️',
      originalCode: code,
    }
  })
})

function isSourceLanguage(locale: string): boolean {
  return locale === props.sourceLanguage
}

function getTranslationValue(locale: string): string {
  const msgstr = props.translationEntry?.locales[locale]

  if (isSourceLanguage(locale) && !msgstr)
    return props.translationEntry?.id || ''

  return msgstr || ''
}

function handleSaveTranslation(locale: string, value: string) {
  emit('saveTranslation', locale, value)
}

function handleReferenceClick(reference: string) {
  emit('goToReference', reference)
}
</script>

<template>
  <div v-if="props.translationEntry" class="flex flex-col gap-3">
    <!-- Reference List -->
    <ReferencesList
      :references="props.translationEntry.references"
      @click-reference="handleReferenceClick"
    />

    <!-- Translation Entry -->
    <TranslationItem
      v-for="locale in locales"
      :key="locale.code"
      :locale="locale"
      :value="getTranslationValue(locale.originalCode)"
      placeholder="To be translated..."
      :is-source="isSourceLanguage(locale.originalCode)"
      @update:value="(value) => handleSaveTranslation(locale.originalCode, value)"
      @translate-machine="emit('translateByMachine', $event)"
    />

    <!-- AI Translation Panel -->
    <AITranslatePanel
      :ai-models="props.aiModels"
      :is-translating="props.isTranslating"
      @translate-all="emit('translateAllByMachine')"
      @translate-all-a-i="emit('translateAllByAI')"
      @update-selected-model="emit('updateSelectedModel', $event)"
    />
  </div>
  <div v-else class="flex justify-center items-center h-50 bg-gray-50 rounded text-gray-600">
    <p>Please select a translation entry</p>
  </div>
</template>
