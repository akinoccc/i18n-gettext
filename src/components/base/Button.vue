<script setup lang="ts">
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
    class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    :class="{
      'opacity-50 cursor-not-allowed': props.disabled || props.loading,
      'text-xs py-0.5 px-1.5': props.size === 'sm',
      'text-base py-1.5 px-3': props.size === 'lg',
    }"
    :disabled="props.disabled || props.loading"
  >
    <span v-if="props.loading">加载中...</span>
    <slot v-else />
  </button>
</template>
