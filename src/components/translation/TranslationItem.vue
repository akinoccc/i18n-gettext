<script setup lang="ts">
import type { LocaleIdentifier } from 'types'
import { Bot, Languages } from 'lucide-vue-next'
import LanguageTag from './LanguageTag.vue'

interface Props {
  locale: LocaleIdentifier & { originalCode: string }
  value: string
  placeholder: string
  isSource: boolean
  selectedModel: string
  isAITranslating: boolean
  isMachineTranslating: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:value': [value: string]
  'translateByMachine': [locale: LocaleIdentifier & { originalCode: string }]
  'translateSingleByAI': []
}>()

function handleChange(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:value', target.value)
}

function handleMachineTranslate() {
  emit('translateByMachine', props.locale)
}

function handleSingleAITranslate() {
  emit('translateSingleByAI')
}
</script>

<template>
  <div class="flex items-center h-12 border border-gray-200 rounded-md overflow-hidden bg-white hover:border-gray-300 transition-colors duration-200">
    <LanguageTag
      :code="props.locale.code"
      :flag="props.locale.flag"
      :name="props.locale.name"
    />

    <div class="flex-1 px-3 h-full">
      <input
        :value="props.value"
        class="w-full h-full bg-transparent border-0 focus:outline-none text-gray-700 placeholder:text-gray-400"
        :placeholder="props.placeholder"
        @blur="(e) => emit('update:value', (e.target as HTMLInputElement).value)"
        @change="handleChange"
      >
    </div>

    <div class="flex items-center pr-3 gap-2 h-full">
      <div
        v-if="props.isSource"
        class="px-2 py-1 text-xs font-medium bg-gray-50 text-gray-600 rounded"
      >
        source
      </div>
      <div v-else class="flex gap-2">
        <button
          class="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="props.isMachineTranslating || props.isAITranslating"
          @click="handleMachineTranslate"
        >
          <span v-if="props.isMachineTranslating" class="flex items-center gap-2">
            <span class="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Translating...
          </span>
          <template v-else>
            <Languages :size="14" />
            <span>Machine</span>
          </template>
        </button>
        <button
          v-if="props.selectedModel"
          :disabled="props.isAITranslating || props.isMachineTranslating"
          class="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleSingleAITranslate"
        >
          <span v-if="props.isAITranslating" class="flex items-center gap-2">
            <span class="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            Translating...
          </span>
          <template v-else>
            <Bot :size="14" />
            <span>AI</span>
          </template>
        </button>
      </div>
    </div>
  </div>
</template>
