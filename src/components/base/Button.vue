<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  disabled: false,
  loading: false,
})
</script>

<template>
  <button
    class="flex items-center justify-center gap-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    :class="{
      'opacity-50 cursor-not-allowed': props.disabled || props.loading,
      'text-xs py-0.5 px-1.5': props.size === 'sm',
      'text-base py-1.5 px-3': props.size === 'lg',
    }"
    :disabled="props.disabled || props.loading"
  >
    <LoaderCircle v-if="props.loading" class="w-4 h-4 animate-spin" />
    <slot />
  </button>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
