<script setup lang="ts">
interface Props {
  code: string
  name: string
  flag: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="flex items-center gap-2 px-3 border-r border-gray-200 min-w-32 h-full bg-gray-50">
    <span class="text-lg">{{ props.flag }}</span>
    <div class="flex flex-col items-center">
      <span class="text-sm font-medium">{{ props.name }}</span>
      <span class="text-xs text-gray-500 uppercase">{{ props.code }}</span>
    </div>
  </div>
</template>
