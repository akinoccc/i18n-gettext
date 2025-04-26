<script lang="ts" setup>
import type { TranslationEntryWithState } from '@/store/translation'
import { useTranslationStore } from '@/store/translation'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted } from 'vue'
import { WebViewMessageType } from '../../constants'
import TranslationEditor from '../components/translation/TranslationEditor.vue'
import { vscodeApi } from '../utils'

const props = defineProps<{
  entry?: TranslationEntryWithState
  disableBatchActions?: boolean
}>()

const translationStore = useTranslationStore()

const { selectedEntries } = storeToRefs(translationStore)

const currentEntry = computed(() => props.entry ?? selectedEntries.value[0])

// 检测操作系统类型，用于显示正确的快捷键
const isMac = computed(() => navigator.platform.includes('Mac'))

// Handle keyboard shortcuts
function handleKeyDown(event: KeyboardEvent) {
  // Check for Ctrl+Enter or Cmd+Enter
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    // Send message to extension to navigate to next untranslated entry
    nextUnTranslatedEntry()
  }
}

function nextUnTranslatedEntry() {
  vscodeApi.postMessage({
    type: WebViewMessageType.NEXT_UNTRANSLATED_ENTRY,
    data: null,
  })
}

onMounted(() => {
  // Add keyboard event listener
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  // Remove keyboard event listener
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div>
    <header v-if="currentEntry" class="mb-5">
      <div class="flex items-center gap-2">
        <h1 class="text-lg font-semibold m-0">
          "{{ currentEntry?.id }}"
        </h1>
        <div v-if="currentEntry?.msgctxt" class="bg-truegray-100 text-truegray-600 px-2 py-1 rounded dark:bg-truegray-800 dark:text-truegray-400">
          {{ currentEntry?.msgctxt }}
        </div>
      </div>
    </header>

    <TranslationEditor
      :translation-entry="currentEntry"
      :disable-actions="disableBatchActions"
    />

    <!-- Keyboard Shortcut Tip -->
    <div v-if="!disableBatchActions" class="flex items-center justify-center mt-16 gap-2 px-3 py-2 text-sm text-gray-400">
      <kbd class="px-2 py-1 bg-white dark:bg-truegray-900 border border-truegray-300 dark:border-truegray-700 rounded-md shadow-sm font-mono text-xs text-truegray-400 dark:text-truegray-400" @click="nextUnTranslatedEntry">
        {{ isMac ? '⌘' : 'Ctrl' }} + Enter
      </kbd>
      <span>to navigate to next untranslated item</span>
    </div>
  </div>
</template>
