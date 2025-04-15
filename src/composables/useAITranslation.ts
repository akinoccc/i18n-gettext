import { computed, ref } from 'vue'
import type { AIBatchTranslateResultData, AIModelConfig, AITranslateResultData, TranslationEntry } from '../types'
import { useVscodeApi } from './useVscodeApi'

export function useAITranslation() {
  const vscodeApi = useVscodeApi()
  const aiModels = ref<AIModelConfig[]>([])
  const selectedAIModel = ref('')
  const isTranslating = ref(false)
  const error = ref('')

  // 解析模型 ID 字符串
  function parseModelId(modelId: string): { provider: string, modelId: string } {
    const [provider, id] = modelId.split(':')
    return { provider, modelId: id }
  }

  // 初始化 AI 模型选项
  function initAIModelOptions() {
    // 设置默认选择的模型
    if (aiModels.value.length > 0 && !selectedAIModel.value) {
      selectedAIModel.value = aiModels.value[0].id
    }
  }

  // 更新选择的AI模型
  function updateSelectedModel(modelId: string) {
    selectedAIModel.value = modelId
  }

  // 单个条目机器翻译
  function translateByMachine(
    translationEntry: TranslationEntry, 
    locale: { originalCode: string, code: string }
  ) {
    vscodeApi.postMessage({
      type: 'i18n-gettext.translateByMachine',
      data: {
        entry: JSON.stringify(translationEntry),
        originalCode: locale.originalCode,
        targetCode: locale.code,
        aiModel: selectedAIModel.value,
      },
    })
  }

  // 一键机器翻译所有未翻译的语言
  function translateAllByMachine(translationEntry: TranslationEntry, sourceLanguage: string) {
    // 获取非源语言的所有语言
    if (!translationEntry?.locales)
      return

    const availableCodes = Object.keys(translationEntry.locales)
    const toTranslateLocales = availableCodes
      .filter(code => code !== sourceLanguage && !translationEntry?.locales[code])
      .map(code => ({ originalCode: code, code }))

    // 对每种语言进行机器翻译
    toTranslateLocales.forEach((locale) => {
      translateByMachine(translationEntry, locale)
    })
  }

  // 一键AI翻译所有未翻译的语言
  function translateAllByAI(translationEntry: TranslationEntry, sourceLanguage: string) {
    if (!translationEntry?.locales)
      return

    // 获取非源语言的所有语言
    const availableCodes = Object.keys(translationEntry.locales)
    const toTranslateLocales = availableCodes
      .filter(code => code !== sourceLanguage && !translationEntry?.locales[code])
      .map(code => ({ originalCode: code, code }))

    if (toTranslateLocales.length === 0)
      return

    // 设置翻译中状态
    isTranslating.value = true
    error.value = ''

    // 获取选中的模型
    const modelIdParts = parseModelId(selectedAIModel.value)
    const modelInfo = {
      provider: modelIdParts.provider,
      modelId: modelIdParts.modelId,
      label: aiModels.value.find(m => m.id === selectedAIModel.value)?.label || selectedAIModel.value,
    }

    // 使用批量翻译来减少token消耗
    if (toTranslateLocales.length > 1) {
      // 收集所有目标语言代码
      const targetLanguages = toTranslateLocales.map(locale => locale.originalCode)

      // 使用批量翻译功能，发送消息到扩展端
      vscodeApi.postMessage({
        type: 'i18n-gettext.aiBatchTranslate',
        data: {
          sourceText: translationEntry.id,
          sourceLanguage,
          targetLanguages,
          model: JSON.stringify(modelInfo),
        //   references: translationEntry?.references,
          msgctxt: translationEntry?.msgctxt,
          entry: JSON.stringify(translationEntry),
        },
      })
    }
    else {
      // 如果只有一种语言，使用单一翻译功能
      const locale = toTranslateLocales[0]

      // 发送消息到扩展端
      vscodeApi.postMessage({
        type: 'i18n-gettext.aiTranslate',
        data: {
          sourceText: translationEntry.id,
          sourceLanguage,
          targetLanguage: locale.originalCode,
          model: JSON.stringify(modelInfo),
        //   references: translationEntry?.references,
          msgctxt: translationEntry?.msgctxt,
          entry: JSON.stringify(translationEntry),
        },
      })
    }
  }

  // 处理AI翻译结果
  function handleAITranslateResult(
    data: AITranslateResultData, 
    translationEntry: TranslationEntry
  ) {
    isTranslating.value = false

    if (data.error) {
      error.value = data.error
      return
    }

    // 更新翻译条目
    if (translationEntry && data.targetLanguage && data.result) {
      translationEntry.locales[data.targetLanguage] = data.result
    }
  }

  // 处理AI批量翻译结果
  function handleAIBatchTranslateResult(
    data: AIBatchTranslateResultData, 
    translationEntry: TranslationEntry
  ) {
    isTranslating.value = false

    if (data.error) {
      error.value = data.error
      return
    }

    // 更新翻译条目
    if (translationEntry && data.results) {
      Object.entries(data.results).forEach(([langCode, translation]) => {
        translationEntry.locales[langCode] = translation
      })
    }
  }

  // 设置消息监听
  function setupMessageListeners(translationEntry: TranslationEntry) {
    // 处理模型配置消息
    vscodeApi.on('i18n-gettext.sendModelConfig', (data: { models: string }) => {
      const models = JSON.parse(data.models) as Array<{ provider: string, model: string, apiKey: string }>
      if (models && models.length > 0) {
        // 更新选项列表
        aiModels.value = models.map(model => ({
          id: `${model.provider}:${model.model}`,
          label: `${model.provider[0].toUpperCase() + model.provider.slice(1)} ${model.model}`,
        }))

        // 设置默认选择的模型
        if (aiModels.value.length > 0 && !selectedAIModel.value) {
          selectedAIModel.value = aiModels.value[0].id
        }
      }
    })

    // 监听AI翻译结果
    vscodeApi.on('i18n-gettext.aiTranslateResult', (data: AITranslateResultData) => {
      handleAITranslateResult(data, translationEntry)
    })

    // 监听AI批量翻译结果
    vscodeApi.on('i18n-gettext.aiBatchTranslateResult', (data: AIBatchTranslateResultData) => {
      handleAIBatchTranslateResult(data, translationEntry)
    })
  }

  return {
    aiModels,
    selectedAIModel,
    isTranslating,
    error,
    initAIModelOptions,
    updateSelectedModel,
    translateByMachine,
    translateAllByMachine,
    translateAllByAI,
    setupMessageListeners,
  }
} 