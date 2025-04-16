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
  isTranslating: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:value': [value: string]
  'translateMachine': [locale: LocaleIdentifier & { originalCode: string }]
  'translateAI': []
}>()

function handleChange(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:value', target.value)
}

function handleMachineTranslate() {
  emit('translateMachine', props.locale)
}

function handleAITranslate() {
  emit('translateAI')
}
</script>

<template>
  <div class="flex items-center h-12 border border-gray-200 rounded-md overflow-hidden bg-white hover:border-gray-300 transition-colors duration-200">
    <LanguageTag
      :code="props.locale.code"
      :flag="props.locale.flag"
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
          class="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors duration-200"
          @click="handleMachineTranslate"
        >
          <Languages :size="14" />
          <span>Machine</span>
        </button>
        <button
          v-if="props.selectedModel"
          :disabled="props.isTranslating"
          class="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleAITranslate"
        >
          <Bot :size="14" />
          <span v-if="props.isTranslating">
            <span class="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </span>
          <span v-else>AI</span>
        </button>
      </div>
    </div>
  </div>
</template>
