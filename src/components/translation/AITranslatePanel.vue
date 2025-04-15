<script setup lang="ts">
import { ref } from 'vue'
import type { AIModelConfig } from '../../types'
import Button from '../base/Button.vue'

interface Props {
  aiModels: AIModelConfig[]
  isTranslating: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['translateAll', 'translateAllAI', 'updateSelectedModel'])

const selectedModel = ref('')

// 初始化选择的模型
if (props.aiModels.length > 0 && !selectedModel.value) {
  selectedModel.value = props.aiModels[0].id
}

function handleModelChange(e: Event) {
  const target = e.target as HTMLSelectElement
  selectedModel.value = target.value
  emit('updateSelectedModel', target.value)
}

function handleMachineTranslate() {
  emit('translateAll')
}

function handleAITranslate() {
  emit('translateAllAI')
}
</script>

<template>
  <div class="flex p-2 gap-2 items-end">
    <div v-if="props.aiModels.length" class="relative">
      <select
        v-model="selectedModel"
        class="bg-gray-100 text-gray-600 px-2 py-1 rounded cursor-pointer"
        @change="handleModelChange"
      >
        <option v-for="model in props.aiModels" :key="model.id" :value="model.id">
          {{ model.label }}
        </option>
      </select>
    </div>

    <Button size="sm" @click="handleMachineTranslate">
      机器翻译
    </Button>

    <Button
      size="sm"
      :loading="props.isTranslating"
      :disabled="props.isTranslating"
      @click="handleAITranslate"
    >
      {{ props.isTranslating ? '翻译中...' : 'AI 翻译' }}
    </Button>
  </div>
</template>


