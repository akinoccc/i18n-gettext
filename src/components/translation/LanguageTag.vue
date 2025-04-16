<script setup lang="ts">
interface Props {
  code: string
  flag: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="flex items-center gap-2 px-3 border-r border-gray-200 w-24 h-full bg-gray-50">
    <span class="text-lg">{{ props.flag }}</span>
    <span class="text-xs font-medium text-gray-600 uppercase">{{ props.code }}</span>
  </div>
</template>
