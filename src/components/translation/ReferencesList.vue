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
  <div v-if="props.references?.length" class="border bg-white border-truegray-200 dark:bg-truegray-900 dark:border-truegray-700 rounded-md overflow-hidden">
    <div
      class="py-2 px-3 bg-truegray-50 hover:(bg-truegray-100 bg-truegray-700) dark:bg-truegray-800 flex items-center gap-2 cursor-pointer select-none transition-colors duration-200"
      @click="toggleReferences"
    >
      <ChevronRight
        :size="16"
        class="text-gray-500 transition-transform duration-200"
        :class="{ 'rotate-90': showReferences }"
      />
      <span class="text-sm text-truegray-700 dark:text-truegray-300 font-medium">References ({{ props.references.length }})</span>
    </div>
    <div
      class="transition-all duration-200 overflow-hidden"
      :class="{ 'max-h-[200px] overflow-y-auto': showReferences, 'max-h-0': !showReferences }"
    >
      <div
        v-for="(reference, index) in props.references"
        :key="index"
        class="py-2 px-3 flex items-center gap-2 border-t border-truegray-100 dark:border-truegray-700 cursor-pointer transition-colors hover:bg-gray-50"
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
