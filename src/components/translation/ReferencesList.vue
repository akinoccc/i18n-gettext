<script setup lang="ts">
import { ChevronRight, FileText } from 'lucide-vue-next'
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
  <div v-if="props.references?.length" class="border border-gray-200 rounded-md overflow-hidden bg-white">
    <div
      class="py-2 px-3 bg-gray-50 flex items-center gap-2 cursor-pointer select-none hover:bg-gray-100 transition-colors duration-200"
      @click="toggleReferences"
    >
      <ChevronRight
        :size="16"
        class="text-gray-500 transition-transform duration-200"
        :class="{ 'rotate-90': showReferences }"
      />
      <span class="text-sm text-gray-700 font-medium">References ({{ props.references.length }})</span>
    </div>
    <div
      class="transition-all duration-200 overflow-hidden"
      :class="{ 'max-h-[200px] overflow-y-auto': showReferences, 'max-h-0': !showReferences }"
    >
      <div
        v-for="(reference, index) in props.references"
        :key="index"
        class="py-2 px-3 flex items-center gap-2 border-t border-gray-100 cursor-pointer transition-colors hover:bg-gray-50"
        @click="handleReferenceClick(reference)"
      >
        <FileText :size="14" class="text-gray-400" />
        <span class="text-xs text-blue-600 hover:text-blue-700 transition-colors duration-200 truncate">
          {{ reference }}
        </span>
      </div>
    </div>
  </div>
</template>
