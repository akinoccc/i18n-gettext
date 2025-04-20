<script setup lang="ts">
import type { LocaleIdentifier } from 'types'
import { AlertCircle, Bot, Languages } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
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

// Track the original value to compare with changes
const originalValue = ref(props.value)

// Update originalValue when props.value changes (e.g., from machine translation)
watch(() => props.value, (newValue) => {
  originalValue.value = newValue
})

// Computed property to check if the item is untranslated
const isUntranslated = computed(() => {
  return !props.isSource && !props.value
})

function handleChange(e: Event) {
  const target = e.target as HTMLInputElement
  const newValue = target.value

  // Only emit update if the value has actually changed
  if (newValue !== originalValue.value) {
    originalValue.value = newValue // Update our tracked value
    emit('update:value', newValue)
  }
}

function handleBlur(e: Event) {
  const target = e.target as HTMLInputElement
  const newValue = target.value

  // Only emit update if the value has actually changed
  if (newValue !== originalValue.value) {
    originalValue.value = newValue // Update our tracked value
    emit('update:value', newValue)
  }
}

function handleMachineTranslate() {
  emit('translateByMachine', props.locale)
}

function handleSingleAITranslate() {
  emit('translateSingleByAI')
}
</script>

<template>
  <div class="flex items-center h-12 border border-truegray-200 rounded-md overflow-hidden bg-white hover:border-truegray-300 dark:bg-truegray-900 dark:border-truegray-700 dark:hover:border-truegray-500 transition-colors duration-200" :class="{ 'border-amber-300': isUntranslated }">
    <LanguageTag
      :code="props.locale.code"
      :flag="props.locale.flag"
      :name="props.locale.name"
    />

    <div class="flex-1 px-3 h-full">
      <input
        :value="props.value"
        class="w-full h-full bg-transparent border-0 focus:outline-none text-gray-700 placeholder:text-gray-400 dark:text-truegray-300 dark:placeholder:text-truegray-600"
        :class="{ 'bg-amber-50/30': isUntranslated }"
        :placeholder="props.placeholder"
        @blur="handleBlur"
        @change="handleChange"
      >
    </div>

    <div class="flex items-center pr-3 gap-2 h-full">
      <!-- Untranslated indicator -->
      <div
        v-if="isUntranslated"
        class="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-400 rounded"
        title="Untranslated"
      >
        <AlertCircle :size="14" />
        <span class="hidden sm:inline">Untranslated</span>
      </div>
      <div
        v-if="props.isSource"
        class="px-2 py-1 text-xs font-medium bg-gray-50 text-gray-600 dark:bg-truegray-800 dark:text-truegray-400 rounded"
      >
        source
      </div>
      <div v-else class="flex gap-2">
        <button
          class="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded hover:bg-blue-100 dark:bg-blue-700 dark:text-blue-100 dark:hover:bg-blue-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
          class="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-purple-50 text-purple-600 rounded hover:bg-purple-100 dark:bg-purple-700 dark:text-purple-400 dark:hover:bg-purple-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
