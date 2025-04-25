<script setup lang="ts">
import type { TranslationEntryWithState } from '@/store/translation'
import type { ModelInfo } from 'types'
import { useTranslationEntry } from '@/composables/useTranslationEntry'
import { useTranslator } from '@/composables/useTranslator'
import { useConfigStore } from '@/store/config'
import { TranslationState, useTranslationStore } from '@/store/translation'
import { AlertCircle } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, ref, watchEffect } from 'vue'
import { localesMap } from '../../../constants/locale'
import ReferencesList from './ReferencesList.vue'
import TranslationActions from './TranslateActions.vue'
import TranslationItem from './TranslationItem.vue'

interface Props {
  translationEntry?: TranslationEntryWithState
  disableActions?: boolean
}

const props = defineProps<Props>()

const { setOnlyTranslateUntranslated, setSelectedModel } = useConfigStore()
const { vscodeConfig, aiModels } = storeToRefs(useConfigStore())
const { translateAllByAI, translateAllByMachine, translateByMachine, translateSingleByAI } = useTranslator()
const { saveTranslation, goToReference } = useTranslationEntry()
const { setLocaleState } = useTranslationStore()
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
    .filter(([code, value]) => code !== vscodeConfig.value!.sourceLanguage && !value)
    .length
})

function parseModel(model: string): ModelInfo {
  const [provider, modelId] = model.split(':::')
  return { provider, modelId }
}

// 监听translationEntry的变化，当切换到新条目时重置选中的AI模型
watchEffect(() => {
  // 当切换条目时，如果有可用的AI模型，并且没有选择AI模型，将模型重置为第一个
  if (aiModels.value.length && !selectedModel.value) {
    selectedModel.value = `${aiModels.value[0].provider}:::${aiModels.value[0].modelId}`
    setSelectedModel(parseModel(selectedModel.value))
  }
})

function isSourceLanguage(locale: string): boolean {
  return locale === vscodeConfig.value?.sourceLanguage
}

function getTranslationValue(locale: string): string {
  const msgstr = props.translationEntry?.locales[locale]

  if (isSourceLanguage(locale) && !msgstr)
    return props.translationEntry?.id || ''

  return msgstr || ''
}

function handleSaveTranslation(locale: string, value: string) {
  saveTranslation(props.translationEntry!, locale, value)
}

function handleReferenceClick(reference: string) {
  goToReference(reference)
}

function handleModelChange(model: ModelInfo) {
  setSelectedModel(model)
}

// 计算按钮状态的辅助函数
function isItemAITranslating(locale: string): boolean {
  return props.translationEntry?.localesState?.[locale]?.ai === TranslationState.None || false
}

function isItemMachineTranslating(locale: string): boolean {
  return props.translationEntry?.localesState?.[locale]?.machine === TranslationState.None || false
}

function handleClearHighlight(locale: string) {
  setLocaleState({
    entry: props.translationEntry!,
    type: 'all',
    locales: [locale],
    state: TranslationState.None,
  })
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
        :state="translationEntry!.localesState[locale.originalCode]"
        :value="getTranslationValue(locale.originalCode)"
        :selected-model="selectedModel"
        placeholder="To be translated..."
        :is-source="isSourceLanguage(locale.originalCode)"
        :is-a-i-translating="isItemAITranslating(locale.originalCode)"
        :is-machine-translating="isItemMachineTranslating(locale.originalCode)"
        @update:value="(value) => handleSaveTranslation(locale.originalCode, value)"
        @clear-highlight="handleClearHighlight(locale.originalCode)"
        @translate-by-machine="() => translateByMachine(locale, props.translationEntry!)"
        @translate-single-by-a-i="() => translateSingleByAI(vscodeConfig!.sourceLanguage, locale.code, translationEntry!)"
      />
    </div>

    <!-- Translation Actions & AI Model Selection -->
    <div
      v-if="!props.disableActions"
      class="flex flex-col gap-3 p-3"
    >
      <!-- AI Model Selection -->
      <div v-if="aiModels.length" class="flex items-center justify-end gap-3 pb-2">
        <select
          v-model="selectedModel"
          class="w-fit text-sm bg-transparent border border-truegray-200 dark:border-truegray-700 rounded-md px-3 py-1.5 text-truegray-600 dark:text-truegray-400 focus:border-purple-300 focus:outline-none cursor-pointer"
          @change="(e) => handleModelChange(parseModel((e.target as HTMLSelectElement).value))"
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
      <TranslationActions
        :locale-state="translationEntry!.localesState"
        :enable-a-i="!!selectedModel"
        @translate-all-machine="translateAllByMachine(vscodeConfig!.sourceLanguage, translationEntry!)"
        @translate-all-a-i="translateAllByAI(vscodeConfig!.sourceLanguage, translationEntry!)"
      />
      <div class="flex justify-end gap-2">
        <input
          :checked="vscodeConfig?.onlyTranslateUntranslated"
          type="checkbox"
          @change="(e) => setOnlyTranslateUntranslated((e.target as HTMLInputElement).checked)"
        >
        <label>
          Only translate untranslated items
        </label>
      </div>
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
