<script setup lang="ts">
import type { LocaleIdentifier } from 'types'
import Button from '../base/Button.vue'
import LanguageTag from './LanguageTag.vue'

interface Props {
  locale: LocaleIdentifier & { originalCode: string }
  value: string
  placeholder: string
  isSource: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:value': [value: string]
  'translateMachine': [locale: LocaleIdentifier & { originalCode: string }]
}>()

function handleChange(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:value', target.value)
}

function handleMachineTranslate() {
  emit('translateMachine', props.locale)
}
</script>

<template>
  <div class="flex items-center h-12 border border-solid border-gray-200 rounded overflow-hidden">
    <LanguageTag
      :code="props.locale.code"
      :flag="props.locale.flag"
    />

    <div class="flex-1 pr-6 h-full">
      <input
        :value="props.value"
        class="w-full focus:outline-none! h-full"
        :placeholder="props.placeholder"
        @blur="(e) => emit('update:value', (e.target as HTMLInputElement).value)"
        @change="handleChange"
      >
    </div>

    <div class="flex p-2 gap-2 items-start">
      <div v-if="props.isSource" class="bg-gray-100 text-gray-600 px-2 py-1 rounded">
        source
      </div>
      <div v-else class="flex gap-2">
        <Button
          size="sm"
          @click="handleMachineTranslate"
        >
          机翻
        </Button>
        <Button size="sm">
          AI
        </Button>
      </div>
    </div>
  </div>
</template>
