<script setup lang="ts">
import type { AIModelConfig, LocaleIdentifier, TranslationEntry } from '../../types'
import { computed } from 'vue'
import AITranslatePanel from './AITranslatePanel.vue'
import ReferencesList from './ReferencesList.vue'
import TranslationItem from './TranslationItem.vue'

interface Props {
  translationEntry: TranslationEntry
  aiModels: AIModelConfig[]
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

// 计算显示的本地化列表
const locales = computed(() => {
  if (!props.translationEntry?.locales)
    return []

  // 获取所有可用的本地化代码
  const availableCodes = Object.keys(props.translationEntry!.locales)

  // 使用本地化工具创建语言标识对象
  return availableCodes.map((code) => {
    // 这里假设我们导入了useLocale并用它获取语言信息
    // 简化起见，直接创建语言标识对象
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
    <!-- 引用列表 -->
    <ReferencesList
      :references="props.translationEntry.references"
      @clickReference="handleReferenceClick"
    />

    <!-- 翻译条目 -->
    <TranslationItem
      v-for="locale in locales"
      :key="locale.code"
      :locale="locale"
      :value="getTranslationValue(locale.originalCode)"
      :placeholder="`${locale.name}翻译...`"
      :is-source="isSourceLanguage(locale.originalCode)"
      @update:value="(value) => handleSaveTranslation(locale.originalCode, value)"
      @translateMachine="emit('translateByMachine', $event)"
    />

    <!-- AI翻译面板 -->
    <AITranslatePanel
      :ai-models="props.aiModels"
      :is-translating="props.isTranslating"
      @translateAll="emit('translateAllByMachine')"
      @translateAllAI="emit('translateAllByAI')"
      @updateSelectedModel="emit('updateSelectedModel', $event)"
    />
  </div>
  <div v-else class="flex justify-center items-center h-50 bg-gray-50 rounded text-gray-600">
    <p>请选择一个翻译条目</p>
  </div>
</template>


