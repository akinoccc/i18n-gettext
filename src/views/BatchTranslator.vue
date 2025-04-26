<script setup lang="ts">
import type { ModelInfo } from 'types'
import TranslateActions from '@/components/translation/TranslateActions.vue'
import TranslationProgressDialog from '@/components/translation/TranslationProgressDialog.vue'
import { useTranslator } from '@/composables/useTranslator'
import { useConfigStore } from '@/store/config'
import { useTranslationStore } from '@/store/translation'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import SingleTranslator from './SingleTranslator.vue'

const { selectedEntries } = storeToRefs(useTranslationStore())
const { vscodeConfig, aiModels, selectedModel } = storeToRefs(useConfigStore())
const { setSelectedModel, setOnlyTranslateUntranslated } = useConfigStore()
const { translateAllByAI, translateAllByMachine } = useTranslator()

// 定义每个条目的进度信息类型
interface EntryProgress {
  id: string
  text: string
  totalLanguages: number
  completedLanguages: number
  languages: {
    code: string
    completed: boolean
    success: boolean
  }[]
}

// 翻译进度对话框状态
const showProgressDialog = ref(false)
const translationType = ref<'ai' | 'machine'>('machine')
const translatedCount = ref(0)
const totalItemsToTranslate = ref(0)
const entriesProgress = ref<EntryProgress[]>([])

// 计算需要翻译的总条目数
function calculateTotalItems(type: 'ai' | 'machine') {
  let count = 0

  selectedEntries.value.forEach((entry) => {
    // 获取所有非源语言的语言代码
    const availableCodes = Object.keys(entry.locales || {})
    const toTranslateLocales = availableCodes.filter((code) => {
      const isSourceLanguage = code === vscodeConfig.value!.sourceLanguage
      const isTranslated = entry.locales[code]
      if (vscodeConfig.value!.onlyTranslateUntranslated) {
        return !isSourceLanguage && !isTranslated
      }
      return !isSourceLanguage
    })

    count += toTranslateLocales.length
  })

  return count
}

function parseModel(model: string): ModelInfo {
  const [provider, modelId] = model.split(':::')
  return { provider, modelId }
}

// 初始化条目进度信息
function initEntriesProgress(type: 'ai' | 'machine') {
  entriesProgress.value = []

  selectedEntries.value.forEach((entry) => {
    // 获取所有非源语言的语言代码
    const availableCodes = Object.keys(entry.locales || {})
    const toTranslateLocales = availableCodes.filter((code) => {
      const isSourceLanguage = code === vscodeConfig.value!.sourceLanguage
      const isTranslated = entry.locales[code]
      if (vscodeConfig.value!.onlyTranslateUntranslated) {
        return !isSourceLanguage && !isTranslated
      }
      return !isSourceLanguage
    })

    if (toTranslateLocales.length > 0) {
      entriesProgress.value.push({
        id: entry.id,
        text: entry.id,
        totalLanguages: toTranslateLocales.length,
        completedLanguages: 0,
        languages: toTranslateLocales.map(code => ({
          code,
          completed: false,
          success: false,
        })),
      })
    }
  })
}

// 更新条目的翻译进度
function updateEntryProgress(entryId: string, languageCode: string, isSuccess: boolean) {
  const entryIndex = entriesProgress.value.findIndex(e => e.id === entryId)
  if (entryIndex === -1)
    return

  const langIndex = entriesProgress.value[entryIndex].languages.findIndex(l => l.code === languageCode)
  if (langIndex === -1)
    return

  // 标记语言为已完成，并记录成功/失败状态
  entriesProgress.value[entryIndex].languages[langIndex].completed = true
  entriesProgress.value[entryIndex].languages[langIndex].success = isSuccess

  // 更新已完成的语言数量
  entriesProgress.value[entryIndex].completedLanguages++

  // 更新总计数
  translatedCount.value++

  // 如果有任何翻译完成（无论成功或失败），标记为有结果
  hasTranslationResults.value = true
}

// 记录最后一次翻译的类型和结果
const lastTranslationType = ref<'ai' | 'machine' | null>(null)
const hasTranslationResults = ref(false)

// 监听 selectedEntries 变化，重置翻译进度
watch(selectedEntries, (newValue, oldValue) => {
  const hasChange = newValue.some((entry, index) => {
    return entry.id !== oldValue[index]?.id || entry.msgctxt !== oldValue[index]?.msgctxt
  })
  if(!hasChange)
    return

  // 重置翻译进度
  entriesProgress.value = []
  translatedCount.value = 0
  totalItemsToTranslate.value = 0
  hasTranslationResults.value = false

  // 如果对话框正在显示，则关闭它
  if (showProgressDialog.value) {
    showProgressDialog.value = false
  }
}, { deep: true })

function handleTranslateAllByMachine() {
  translationType.value = 'machine'
  lastTranslationType.value = 'machine'
  translatedCount.value = 0
  totalItemsToTranslate.value = calculateTotalItems('machine')

  // 初始化进度信息
  initEntriesProgress('machine')

  showProgressDialog.value = true
  hasTranslationResults.value = false

  selectedEntries.value.forEach((entry) => {
      translateAllByMachine(vscodeConfig.value!.sourceLanguage, entry, (languageCode: string, isSuccess: boolean) => {
        updateEntryProgress(entry.id, languageCode, isSuccess)
      })
  })
}

function handleTranslateAllByAI() {
  translationType.value = 'ai'
  lastTranslationType.value = 'ai'
  translatedCount.value = 0
  totalItemsToTranslate.value = calculateTotalItems('ai')

  // 初始化进度信息
  initEntriesProgress('ai')

  showProgressDialog.value = true
  hasTranslationResults.value = false

  selectedEntries.value.forEach((entry) => {
    translateAllByAI(vscodeConfig.value!.sourceLanguage, entry, (languageCode: string, isSuccess: boolean) => {
      updateEntryProgress(entry.id, languageCode, isSuccess)
    })
  })
}

// 显示最后一次翻译的结果
function showTranslationResults() {
  if (lastTranslationType.value && hasTranslationResults.value) {
    showProgressDialog.value = true
  }
}
</script>

<template>
  <h1 class="text-2xl mb-4 fon">
    Batch Translator
  </h1>

  <div class="pb-30">
    <div
      v-for="entry in selectedEntries"
      :key="entry.id"
    >
      <SingleTranslator :entry="entry" disable-batch-actions />

      <div class="h-1px my-8 bg-truegray-200 dark:bg-truegray-700" />
    </div>
  </div>

  <div
    class="fixed bottom-0 left-0 flex flex-col gap-3 w-full px-3 py-6 bg-white dark:bg-truegray-900 bg-op-90"
  >
    <div v-if="aiModels.length" class="flex items-center justify-end gap-3 pb-2">
      <select
        :value="`${selectedModel.provider}:::${selectedModel.modelId}`"
        class="w-fit text-sm bg-transparent border border-truegray-200 dark:border-truegray-700 rounded-md px-3 py-1.5 text-truegray-600 dark:text-truegray-400 focus:border-purple-300 focus:outline-none cursor-pointer"
        @change="(e) => setSelectedModel(parseModel((e.target as HTMLSelectElement).value))"
      >
        <option value="" disabled selected>
          Select AI Model
        </option>
        <option
          v-for="model in aiModels"
          :key="`${model.provider}:::${model.modelId}`"
          :value="`${model.provider}:::${model.modelId}`"
        >
          {{ model.provider }}:{{ model.modelId }}
        </option>
      </select>
    </div>
    <TranslateActions
      :enable-a-i="!!selectedModel"
      @translate-all-machine="handleTranslateAllByMachine"
      @translate-all-a-i="handleTranslateAllByAI"
    />
    <div class="flex justify-between items-center">
      <button
        v-if="hasTranslationResults"
        class="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
        @click="showTranslationResults"
      >
        <span>Show Translation Results</span>
      </button>
      <div v-else />
      <div class="flex justify-end gap-2">
        <input
          :checked="vscodeConfig?.onlyTranslateUntranslated"
          type="checkbox"
          @change="(e) => setOnlyTranslateUntranslated((e.target as HTMLInputElement).checked)"
        >
        <label>
          Only translate untranslated items
        </label>
      </div>
    </div>
  </div>

  <!-- 翻译进度对话框 -->
  <TranslationProgressDialog
    :show="showProgressDialog"
    :total-count="totalItemsToTranslate"
    :current-count="translatedCount"
    :type="translationType"
    :entries-progress="entriesProgress"
    @close="showProgressDialog = false"
  />
</template>
