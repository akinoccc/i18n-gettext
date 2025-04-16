<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  references: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  clickReference: [reference: string]
}>()

const showReferences = ref(false)

function toggleReferences() {
  showReferences.value = !showReferences.value
}

function handleReferenceClick(reference: string) {
  emit('clickReference', reference)
}
</script>

<template>
  <div v-if="props.references?.length" class="mt-3 border border-solid border-gray-200 rounded overflow-hidden">
    <div class="py-2.5 px-3 bg-gray-100 flex items-center cursor-pointer select-none" @click="toggleReferences">
      <span class="mr-1 text-xs transition-transform duration-200" :class="{ 'rotate-90': showReferences }">▶</span>
      <span>References ({{ props.references.length }})</span>
    </div>
    <div
      class="transition-all duration-200 overflow-hidden"
      :class="{ 'max-h-50 overflow-y-auto': showReferences, 'max-h-0': !showReferences }"
    >
      <div
        v-for="(reference, index) in props.references"
        :key="index"
        class="py-2 px-3 flex items-center gap-2 border-t border-solid border-gray-200 cursor-pointer transition-colors hover:bg-gray-100"
        @click="handleReferenceClick(reference)"
      >
        <span class="text-sm">📄</span>
        <span class="text-xs whitespace-nowrap overflow-hidden text-ellipsis text-blue-600">{{ reference }}</span>
      </div>
    </div>
  </div>
</template>
