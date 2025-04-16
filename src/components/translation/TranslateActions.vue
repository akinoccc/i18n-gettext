<script setup lang="ts">
import { Bot, Languages } from 'lucide-vue-next'

interface Props {
  enableAI: boolean
  isTranslating: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['translateAllMachine', 'translateAllAI'])
</script>

<template>
  <div class="flex items-center justify-end flex-wrap gap-3">
    <button
      class="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors duration-200"
      @click="emit('translateAllMachine')"
    >
      <Languages :size="18" />
      <span>Translate All with Machine</span>
    </button>

    <button
      v-if="props.enableAI"
      :disabled="props.isTranslating"
      class="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      @click="emit('translateAllAI')"
    >
      <Bot :size="18" />
      <span v-if="props.isTranslating" class="flex items-center gap-2">
        <span class="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        Translating...
      </span>
      <span v-else>Translate All with AI</span>
    </button>
  </div>
</template>

<style scoped>
.active\:scale-98:active {
  transform: scale(0.98);
}
</style>
