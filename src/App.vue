<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { WebViewMessageType } from '../constants'
import { useMessageListener } from './composables/useMessageListener'
import { useConfigStore } from './store/config'
import { vscodeApi } from './utils'
import BatchTranslator from './views/BatchTranslator.vue'
import SingleTranslator from './views/SingleTranslator.vue'

const {
  setupAllListeners,
} = useMessageListener()

const { translatorMode } = storeToRefs(useConfigStore())

onMounted(() => {
  // Send ready message to extension
  vscodeApi.postMessage({
    type: WebViewMessageType.WEBVIEW_READY,
    data: null,
  })

  // Set up message listeners
  setupAllListeners()
})
</script>

<template>
  <main class="p-4 font-sans">
    <SingleTranslator v-if="translatorMode === 'single'" />
    <BatchTranslator v-if="translatorMode === 'batch'" />
  </main>
</template>
