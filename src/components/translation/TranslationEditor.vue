<script setup lang="ts">
import type { LocaleIdentifier, ModelInfo, TranslationEntry } from 'types'
import { AlertCircle } from 'lucide-vue-next'
import { computed, ref, watchEffect } from 'vue'
import { localesMap } from '../../../constants/locale'
import ReferencesList from './ReferencesList.vue'
import TranslationActions from './TranslateActions.vue'
import TranslationItem from './TranslationItem.vue'

interface Props {
  translationEntry?: TranslationEntry
  aiModels: ModelInfo[]
  sourceLanguage: string
  isAITranslating: boolean
  isMachineTranslating: boolean
  isAIBatchTranslating: boolean
  isSingleAITranslating: boolean
  isSingleMachineTranslating: boolean
  currentTranslatingLang: string
  languageTranslatingState: Record<string, { ai: boolean, machine: boolean }>
  isLanguageRecentlyTranslated?: (lang: string) => boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  goToReference: [reference: string]
  saveTranslation: [locale: string, value: string]
  translateByMachine: [locale: LocaleIdentifier & { originalCode: string }]
  translateAllByMachine: []
  translateAllByAI: []
  translateSingleByAI: [locale: LocaleIdentifier & { originalCode: string }]
  updateSelectedModel: [modelId: string]
  clearHighlight: [locale: string]
}>()

const selectedModel = ref('')

const locales = computed(() => {
  if (!props.translationEntry?.locales)
    return []

  const availableCodes = Object.keys(props.translationEntry!.locales)

  return availableCodes.map((code) => {
    // 查找匹配的语言配置
    const localeConfig = localesMap.find(locale =>
      locale.code === code || locale.alias.includes(code),
    )

    if (localeConfig) {
      return {
        name: localeConfig.name,
        code,
        flag: localeConfig.flag,
        originalCode: code,
      }
    }

    // 如果没有找到匹配项，返回默认值
    return {
      name: code,
      code,
      flag: '🏳️',
      originalCode: code,
    }
  })
})

// Count untranslated items
const untranslatedCount = computed(() => {
  if (!props.translationEntry?.locales)
    return 0

  // Don't count source language
  return Object.entries(props.translationEntry.locales)
    .filter(([code, value]) => code !== props.sourceLanguage && !value)
    .length
})

watchEffect(() => {
  if (props.aiModels.length) {
    selectedModel.value = `${props.aiModels[0].provider}:${props.aiModels[0].modelId}`
    emit('updateSelectedModel', selectedModel.value)
  }
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

function handleModelChange(modelId: string) {
  selectedModel.value = modelId
  emit('updateSelectedModel', modelId)
}

function handleTranslateByMachine(locale: LocaleIdentifier & { originalCode: string }) {
  emit('translateByMachine', locale)
}

function handleTranslateSingleByAI(locale: LocaleIdentifier & { originalCode: string }) {
  emit('translateSingleByAI', locale)
}

// 计算按钮状态的辅助函数
function isItemAITranslating(locale: string): boolean {
  return props.languageTranslatingState[locale]?.ai || false
}

function isItemMachineTranslating(locale: string): boolean {
  return props.languageTranslatingState[locale]?.machine || false
}

function isItemDisabled(locale: string): boolean {
  // 如果正在进行批量翻译，禁用所有按钮
  if (props.isAIBatchTranslating || (props.isMachineTranslating && !props.isSingleMachineTranslating))
    return true

  // 否则根据自身的翻译状态决定是否禁用
  return isItemAITranslating(locale) || isItemMachineTranslating(locale)
}

function handleClearHighlight(locale: string) {
  emit('clearHighlight', locale)
}

function isRecentlyTranslated(locale: string): boolean {
  return props.isLanguageRecentlyTranslated ? props.isLanguageRecentlyTranslated(locale) : false
}
</script>

<template>
  <div v-if="props.translationEntry" class="flex flex-col gap-4">
    <!-- Reference List -->
    <ReferencesList
      :references="props.translationEntry.references"
      @click-reference="handleReferenceClick"
    />

    <!-- Translation Entries -->
    <div class="flex flex-col gap-2">
      <!-- Untranslated count -->
      <div v-if="untranslatedCount > 0" class="flex items-center gap-2 mb-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-md">
        <AlertCircle :size="16" />
        <span>{{ untranslatedCount }} item{{ untranslatedCount > 1 ? 's' : '' }} need{{ untranslatedCount > 1 ? '' : 's' }} translation</span>
      </div>
      <TranslationItem
        v-for="locale in locales"
        :key="locale.code"
        :locale="locale"
        :value="getTranslationValue(locale.originalCode)"
        :selected-model="selectedModel"
        placeholder="To be translated..."
        :is-source="isSourceLanguage(locale.originalCode)"
        :is-a-i-translating="isItemAITranslating(locale.originalCode)"
        :is-machine-translating="isItemMachineTranslating(locale.originalCode)"
        :is-button-disabled="isItemDisabled(locale.originalCode)"
        :is-recently-translated="isRecentlyTranslated(locale.originalCode)"
        @update:value="(value) => handleSaveTranslation(locale.originalCode, value)"
        @translate-by-machine="handleTranslateByMachine"
        @translate-single-by-a-i="() => handleTranslateSingleByAI(locale)"
        @clear-highlight="handleClearHighlight"
      />
    </div>

    <!-- Translation Actions & AI Model Selection -->
    <div class="flex flex-col gap-3 p-3">
      <!-- AI Model Selection -->
      <div v-if="props.aiModels.length" class="flex items-center justify-end gap-3 pb-2">
        <select
          v-model="selectedModel"
          class="w-fit text-sm bg-transparent border border-truegray-200 dark:border-truegray-700 rounded-md px-3 py-1.5 text-truegray-600 dark:text-truegray-400 focus:border-purple-300 focus:outline-none cursor-pointer"
          @change="(e) => handleModelChange((e.target as HTMLSelectElement).value)"
        >
          <option value="" disabled selected>
            Select AI Model
          </option>
          <option
            v-for="model in props.aiModels"
            :key="`${model.provider}:${model.modelId}`"
          >
            {{ model.provider }}:{{ model.modelId }}
          </option>
        </select>
      </div>
      <!-- Batch Actions -->
      <TranslationActions
        :enable-a-i="!!selectedModel"
        :is-a-i-translating="props.isAIBatchTranslating"
        :is-machine-translating="props.isMachineTranslating && !props.isSingleMachineTranslating"
        :is-any-item-translating="props.isSingleAITranslating || props.isSingleMachineTranslating"
        @translate-all-machine="emit('translateAllByMachine')"
        @translate-all-a-i="emit('translateAllByAI')"
      />
    </div>
  </div>
  <div
    v-else
    class="flex flex-col items-center justify-center gap-3 h-[200px] bg-gray-50 rounded-lg text-gray-500 relative"
  >
    <div class="spinner">
      <div class="spinner-ring" />
    </div>
    <p class="text-sm mt-3 text-gray-500">
      Loading...
    </p>
  </div>
</template>

<style scoped>
.spinner {
  position: relative;
  width: 40px;
  height: 40px;
}

.spinner-ring {
  position: absolute;
  width: 40px;
  height: 40px;
  border: 3px solid transparent;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-ring::after {
  content: "";
  position: absolute;
  top: -3px;
  left: -3px;
  width: 40px;
  height: 40px;
  border: 3px solid transparent;
  border-top-color: #a855f7;
  border-radius: 50%;
  opacity: 0.6;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
