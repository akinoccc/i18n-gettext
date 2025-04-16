<script setup lang="ts">
import type { ModelInfo } from 'types'
import { ref, watchEffect } from 'vue'
import Button from '../base/Button.vue'

interface Props {
  aiModels: ModelInfo[]
  isTranslating: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['translateAll', 'translateAllAI', 'updateSelectedModel'])

const selectedModel = ref('')

watchEffect(() => {
  // 初始化选择的模型
  if (props.aiModels.length > 0 && !selectedModel.value) {
    selectedModel.value = `${props.aiModels[0].provider}:${props.aiModels[0].modelId}`
    emit('updateSelectedModel', selectedModel.value)
  }
})

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
  <div class="flex p-2 gap-2 items-center justify-end">
    <div v-if="props.aiModels.length" class="relative">
      <select
        v-model="selectedModel"
        class="bg-gray-100 text-gray-600 px-2 py-1 rounded cursor-pointer"
        @change="handleModelChange"
      >
        <option v-for="model in props.aiModels" :key="`${model.provider}:${model.modelId}`">
          {{ model.provider }}:{{ model.modelId }}
        </option>
      </select>
    </div>

    <Button @click="handleMachineTranslate">
      机器翻译
    </Button>

    <Button
      v-if="selectedModel"
      :loading="props.isTranslating"
      :disabled="props.isTranslating"
      @click="handleAITranslate"
    >
      {{ props.isTranslating ? '翻译中...' : 'AI 翻译' }}
    </Button>
  </div>
</template>
