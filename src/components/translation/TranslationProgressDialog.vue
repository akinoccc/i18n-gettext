<script setup lang="ts">
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-vue-next'
import { computed } from 'vue'

// 定义每个条目的进度信息
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

interface Props {
  show: boolean
  totalCount: number
  currentCount: number
  type: 'ai' | 'machine'
  entriesProgress: EntryProgress[]
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

// 计算成功和失败的翻译数量
const successCount = computed(() => {
  return props.entriesProgress.reduce((count, entry) => {
    return count + entry.languages.filter(lang => lang.completed && lang.success).length
  }, 0)
})

// 计算总体完成百分比（只计算成功的翻译）
const completionPercentage = computed(() => {
  if (props.totalCount === 0)
    return 0
  return Math.round((successCount.value / props.totalCount) * 100)
})

// 计算总体进度条宽度
const progressWidth = computed(() => {
  return `${completionPercentage.value}%`
})

// 根据类型确定颜色
const progressColor = computed(() => {
  return props.type === 'ai'
    ? 'bg-purple-500 dark:bg-purple-600'
    : 'bg-blue-500 dark:bg-blue-600'
})

// 根据类型和完成状态确定标题
const title = computed(() => {
  const baseTitle = props.type === 'ai'
    ? 'AI Translation'
    : 'Machine Translation'

  return props.currentCount === props.totalCount && props.totalCount > 0
    ? `${baseTitle} Results`
    : `${baseTitle} Progress`
})

// 计算每个条目的进度百分比（只计算成功的翻译）
function getEntryProgressPercentage(entry: EntryProgress) {
  if (entry.totalLanguages === 0)
    return 0

  // 计算成功翻译的数量
  const successCount = entry.languages.filter(lang => lang.completed && lang.success).length

  return Math.round((successCount / entry.totalLanguages) * 100)
}

const failedCount = computed(() => {
  return props.entriesProgress.reduce((count, entry) => {
    return count + entry.languages.filter(lang => lang.completed && !lang.success).length
  }, 0)
})

// 计算是否已完成所有翻译（所有翻译都已处理）
const isAllProcessed = computed(() => {
  return props.currentCount === props.totalCount && props.totalCount > 0
})

// 计算是否所有翻译都成功完成（没有失败的翻译）
const isAllSuccessful = computed(() => {
  return isAllProcessed.value && failedCount.value === 0
})
</script>

<template>
  <transition
    name="dialog-fade"
    enter-active-class="transition duration-300 ease-out"
    leave-active-class="transition duration-200 ease-in"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="show"
      class="fixed inset-0 flex items-center justify-center z-50"
    >
      <!-- 背景遮罩 -->
      <div class="absolute inset-0 bg-black bg-opacity-50 transition-opacity" @click="emit('close')" />

      <!-- 对话框内容 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-xl w-full mx-4 max-h-[80vh] overflow-auto relative z-10">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium" :class="isAllSuccessful ? 'text-green-600 dark:text-green-400' : ''">
            {{ title }}
          </h3>
          <button
            class="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
            @click="emit('close')"
          >
            <XCircle :size="20" />
          </button>
        </div>

        <!-- 总体进度 -->
        <div class="mb-2 flex justify-between">
          <span>{{ currentCount }} / {{ totalCount }} items</span>
          <span>{{ completionPercentage }}%</span>
        </div>

        <!-- 翻译结果统计 -->
        <div v-if="currentCount > 0" class="mb-2 flex justify-between text-sm">
          <span class="flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full bg-green-500" />
            <span>成功: {{ successCount }}</span>
          </span>
          <span v-if="failedCount > 0" class="flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full bg-red-500" />
            <span>失败: {{ failedCount }}</span>
          </span>
        </div>

        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
          <div
            class="h-2.5 rounded-full transition-all duration-300 ease-in-out"
            :class="progressColor"
            :style="{ width: progressWidth }"
          />
        </div>

        <!-- 每个条目的详细进度 -->
        <div class="flex flex-col gap-4 mt-4">
          <div v-for="entry in entriesProgress" :key="entry.id" class="border border-gray-200 dark:border-gray-700 rounded-md p-3">
            <div class="flex items-center gap-2 mb-2">
              <AlertTriangle v-if="entry.languages.some(l => l.completed && !l.success)" class="text-red-500" :size="16" />
              <div class="text-sm font-medium truncate" :title="entry.text">
                {{ entry.text }}
              </div>
            </div>

            <div class="flex justify-between text-xs mb-1">
              <span>{{ entry.completedLanguages }} / {{ entry.totalLanguages }} languages</span>
              <span>{{ getEntryProgressPercentage(entry) }}%</span>
            </div>

            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
              <div
                class="h-1.5 rounded-full transition-all duration-300 ease-in-out"
                :class="entry.languages.some(l => l.completed && !l.success) ? 'bg-red-500 dark:bg-red-600' : progressColor"
                :style="{ width: `${getEntryProgressPercentage(entry)}%` }"
              />
            </div>

            <!-- 语言标签 -->
            <div class="flex flex-wrap gap-1 mt-2">
              <span
                v-for="lang in entry.languages"
                :key="lang.code"
                class="px-1.5 py-0.5 text-xs rounded-md"
                :class="lang.completed
                  ? (lang.success
                    ? (props.type === 'ai' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200')
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200')
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'"
              >
                {{ lang.code }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center justify-center gap-2 mt-6">
          <!-- 翻译进行中 -->
          <div v-if="!isAllProcessed" class="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Translating in progress...</p>
          </div>

          <!-- 翻译全部成功 -->
          <div v-else-if="isAllSuccessful" class="flex items-center gap-2 text-green-500 dark:text-green-400">
            <CheckCircle :size="20" />
            <p class="text-sm font-medium">
              Translation completed!
            </p>
          </div>

          <!-- 翻译部分失败 -->
          <div v-else class="flex items-center gap-2 text-red-500 dark:text-red-400">
            <AlertTriangle :size="20" />
            <p class="text-sm font-medium">
              Translation completed with errors!
            </p>
          </div>

          <button
            v-if="isAllProcessed"
            class="mt-2 px-4 py-2"
            :class="isAllSuccessful ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'"
            @click="emit('close')"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* 确保动画效果平滑 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  will-change: opacity, transform;
}
</style>
