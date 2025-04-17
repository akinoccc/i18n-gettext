<script setup lang="ts">
import type { LocaleIdentifier, ModelInfo, TranslationEntry } from 'types'
import { FileWarning } from 'lucide-vue-next'
import { computed, ref, watchEffect } from 'vue'
import { localesMap } from '../../../constants/locale'
import ReferencesList from './ReferencesList.vue'
import TranslationActions from './TranslateActions.vue'
import TranslationItem from './TranslationItem.vue'

interface Props {
  translationEntry: TranslationEntry
  aiModels: ModelInfo[]
  sourceLanguage: string
  isAITranslating: boolean
  isMachineTranslating: boolean
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

watchEffect(() => {
  if (props.aiModels.length && !selectedModel.value) {
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
      <TranslationItem
        v-for="locale in locales"
        :key="locale.code"
        :locale="locale"
        :value="getTranslationValue(locale.originalCode)"
        :selected-model="selectedModel"
        placeholder="To be translated..."
        :is-source="isSourceLanguage(locale.originalCode)"
        :is-a-i-translating="props.isAITranslating"
        :is-machine-translating="props.isMachineTranslating"
        @update:value="(value) => handleSaveTranslation(locale.originalCode, value)"
        @translate-by-machine="handleTranslateByMachine(locale)"
        @translate-single-by-a-i="handleTranslateSingleByAI(locale)"
      />
    </div>

    <!-- Translation Actions & AI Model Selection -->
    <div class="flex flex-col gap-3 p-3 bg-white">
      <!-- AI Model Selection -->
      <div v-if="selectedModel" class="flex items-center justify-end gap-3 pb-2">
        <select
          v-model="selectedModel"
          class="w-fit text-sm bg-transparent border border-gray-200 rounded-md px-3 py-1.5 text-gray-600 focus:border-purple-300 focus:outline-none cursor-pointer"
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
        :is-a-i-translating="props.isAITranslating"
        :is-machine-translating="props.isMachineTranslating"
        @translate-all-machine="emit('translateAllByMachine')"
        @translate-all-a-i="emit('translateAllByAI')"
      />
    </div>
  </div>
  <div
    v-else
    class="flex flex-col items-center justify-center gap-3 h-[200px] bg-gray-50 rounded-lg text-gray-500"
  >
    <FileWarning :size="32" class="text-gray-400" />
    <p class="text-sm">
      Please select a translation entry
    </p>
  </div>
</template>
