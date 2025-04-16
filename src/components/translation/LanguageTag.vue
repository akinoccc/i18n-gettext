<script setup lang="ts">
interface Props {
  code: string
  flag: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="flex flex-col items-center justify-center min-w-15">
    <span class="text-xl">{{ props.flag }}</span>
    <span class="text-xs">{{ props.code }}</span>
  </div>
</template>
