import type { AIBatchTranslateResultData, AITranslateResultData, ModelInfo, TranslationEntry } from 'types'
import { ref } from 'vue'
import { WebViewMessageType } from '../../constants'
import { useTranslationEntry } from './useTranslationEntry'
import { useVscodeApi } from './useVscodeApi'

export function useAITranslation() {
  const vscodeApi = useVscodeApi()
  const aiModels = ref<ModelInfo[]>([])
  const selectedAIModel = ref('')
  const isTranslating = ref(false)
  const error = ref('')

  const { translationEntry, updateTranslationEntry } = useTranslationEntry()

  // 解析模型 ID 字符串
  function parseModelId(model: string): { provider: string, modelId: string } {
    const [provider, id] = model.split(':')
    return { provider, modelId: id }
  }

  // 更新选择的AI模型
  function updateSelectedModel(model: string) {
    selectedAIModel.value = model
  }

  // 单个条目机器翻译
  function translateByMachine(
    locale: { originalCode: string, code: string },
  ) {
    vscodeApi.postMessage({
      type: WebViewMessageType.TRANSLATE_BY_MACHINE,
      data: {
        entry: JSON.stringify(translationEntry.value),
        originalCode: locale.originalCode,
        targetCode: locale.code,
        aiModel: selectedAIModel.value,
      },
    })
  }

  // 一键机器翻译所有未翻译的语言
  function translateAllByMachine(sourceLanguage: string) {
    // 获取非源语言的所有语言
    if (!translationEntry.value.locales)
      return

    const availableCodes = Object.keys(translationEntry.value.locales)
    const toTranslateLocales = availableCodes
      .filter(code => code !== sourceLanguage && !translationEntry.value.locales[code])
      .map(code => ({ originalCode: code, code }))

    // 对每种语言进行机器翻译
    toTranslateLocales.forEach((locale) => {
      translateByMachine(locale)
    })
  }

  // 一键AI翻译所有未翻译的语言
  function translateAllByAI(sourceLanguage: string) {
    // 获取非源语言的所有语言
    const availableCodes = Object.keys(translationEntry.value.locales)
    const toTranslateLocales = availableCodes
      .filter(code => code !== sourceLanguage && !translationEntry.value.locales[code])
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
    }

    // 使用批量翻译来减少token消耗
    if (toTranslateLocales.length > 1) {
      // 收集所有目标语言代码
      const targetLanguages = toTranslateLocales.map(locale => locale.originalCode)

      // 使用批量翻译功能，发送消息到扩展端
      vscodeApi.postMessage({
        type: WebViewMessageType.AI_BATCH_TRANSLATE,
        data: {
          sourceText: translationEntry.value.id,
          sourceLanguage,
          targetLanguages,
          provider: modelInfo.provider,
          modelId: modelInfo.modelId,
          entryId: translationEntry.value.id,
        },
      })
    }
    else {
      // 如果只有一种语言，使用单一翻译功能
      const locale = toTranslateLocales[0]

      // 发送消息到扩展端
      vscodeApi.postMessage({
        type: WebViewMessageType.AI_TRANSLATE,
        data: {
          sourceText: translationEntry.value.id,
          sourceLanguage,
          targetLanguage: locale.originalCode,
          provider: modelInfo.provider,
          modelId: modelInfo.modelId,
          entryId: translationEntry.value.id,
        },
      })
    }
  }

  // 处理AI翻译结果
  function handleAITranslateResult(
    data: AITranslateResultData,
  ) {
    isTranslating.value = false

    if (data.error) {
      error.value = data.error
      return
    }

    // 更新翻译条目
    if (translationEntry.value && data.targetLanguage && data.result) {
      updateTranslationEntry(data.targetLanguage, data.result)
    }
  }

  // 处理AI批量翻译结果
  function handleAIBatchTranslateResult(
    data: AIBatchTranslateResultData,
  ) {
    isTranslating.value = false

    if (data.error) {
      error.value = data.error
      return
    }

    // 更新翻译条目
    if (translationEntry.value && data.results) {
      Object.entries(data.results).forEach(([langCode, translation]) => {
        updateTranslationEntry(langCode, translation)
      })
    }
  }

  // 设置消息监听
  function setupMessageListeners() {
    // 处理模型配置消息
    vscodeApi.on(WebViewMessageType.SEND_MODEL_CONFIG, (data: { models: string }) => {
      const models = JSON.parse(data.models) as Array<ModelInfo>
      if (models && models.length > 0) {
        // 更新选项列表
        aiModels.value = models.map(model => ({
          provider: model.provider,
          modelId: model.modelId,
        }))

        // 设置默认选择的模型
        if (aiModels.value.length > 0 && !selectedAIModel.value) {
          selectedAIModel.value = aiModels.value[0].modelId
        }
      }
    })

    // 监听AI翻译结果
    vscodeApi.on(WebViewMessageType.AI_TRANSLATE_RESULT, (data: AITranslateResultData) => {
      handleAITranslateResult(data)
    })

    // 监听AI批量翻译结果
    vscodeApi.on(WebViewMessageType.AI_BATCH_TRANSLATE_RESULT, (data: AIBatchTranslateResultData) => {
      handleAIBatchTranslateResult(data)
    })
  }

  return {
    aiModels,
    selectedAIModel,
    isTranslating,
    error,
    updateSelectedModel,
    translateByMachine,
    translateAllByMachine,
    translateAllByAI,
    setupMessageListeners,
  }
}
