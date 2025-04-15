<script setup lang="ts">
interface Props {
  code: string
  flag: string
  isSource?: boolean
}

const props = defineProps<Props>()
</script>

<template>
  <div class="flex flex-col items-center justify-center min-w-15">
    <span class="text-xl">{{ props.flag }}</span>
    <span class="text-xs">{{ props.code }}</span>
    <span v-if="props.isSource" class="text-xs text-gray-500">source</span>
  </div>
</template>


