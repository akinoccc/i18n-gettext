<script setup lang="ts">
import { TranslationState } from '@/store/translation'
import { Bot, Languages } from 'lucide-vue-next'
import { computed } from 'vue'

interface Props {
  enableAI: boolean
  localeState?: Record<string, {
    ai: TranslationState
    machine: TranslationState
  }>
}

const props = defineProps<Props>()
const emit = defineEmits(['translateAllMachine', 'translateAllAI'])

const isAnyItemMachineTranslating = computed(() => {
  return Object.keys(props?.localeState || {})
    .some(locale =>
      props.localeState?.[locale].machine === TranslationState.Translating,
    )
})

const isAnyItemAITranslating = computed(() => {
  return Object.keys(props?.localeState ?? {})
    .some(locale =>
      props.localeState?.[locale].ai === TranslationState.Translating,
    )
})

const isAnyItemTranslating = computed(() => {
  return Object.keys(props?.localeState || {})
    .some(locale =>
      props.localeState?.[locale].ai === TranslationState.Translating
      || props.localeState?.[locale].machine === TranslationState.Translating,
    )
})
</script>

<template>
  <div class="flex items-center justify-end flex-wrap gap-3">
    <button
      class="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-700 dark:text-blue-100 dark:hover:bg-blue-800 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="isAnyItemTranslating"
      @click="emit('translateAllMachine')"
    >
      <span v-if="isAnyItemMachineTranslating" class="flex items-center gap-2">
        <span class="w-3 h-3 border-2 border-blue-600 dark:border-blue-100 border-t-transparent rounded-full animate-spin" />
        Translating...
      </span>
      <template v-else>
        <Languages :size="18" />
        <span>Translate All with Machine</span>
      </template>
    </button>

    <button
      v-if="props.enableAI"
      :disabled="isAnyItemTranslating"
      class="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-700 dark:text-purple-100 dark:hover:bg-purple-800 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      @click="emit('translateAllAI')"
    >
      <span v-if="isAnyItemAITranslating" class="flex items-center gap-2">
        <span class="w-3 h-3 border-2 border-purple-600 dark:border-purple-100 border-t-transparent rounded-full animate-spin" />
        Translating...
      </span>
      <template v-else>
        <Bot :size="18" />
        <span>Translate All with AI</span>
      </template>
    </button>
  </div>
</template>

<style scoped>
.active\:scale-98:active {
  transform: scale(0.98);
}
</style>
