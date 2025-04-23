import type { AIBatchTranslateResultData, AITranslateResultData, ModelInfo, TranslateByMachineResultData } from '../../types'
import { ref } from 'vue'
import { WebViewMessageType } from '../../constants'
import { vscodeApi } from '../utils'
import { useTranslationEntry } from './useTranslationEntry'

export function useAITranslation() {
  const aiModels = ref<ModelInfo[]>([])
  const selectedAIModel = ref<string>('')
  const isAITranslating = ref(false)
  const isMachineTranslating = ref(false)
  const isAIBatchTranslating = ref(false)
  const isSingleAITranslating = ref(false)
  const isSingleMachineTranslating = ref(false)
  const currentTranslatingLang = ref<string>('')
  const error = ref('')

  const { translationEntry, updateTranslationEntry } = useTranslationEntry()

  // Parse model ID string
  function parseModelId(model: string): { provider: string, modelId: string } {
    const [provider, modelId] = model.split(':')
    return { provider, modelId }
  }

  // Update selected AI model
  function updateSelectedModel(model: string) {
    selectedAIModel.value = model
  }

  // Translate single entry by machine
  function translateByMachine(
    locale: { originalCode: string, code: string },
  ) {
    isMachineTranslating.value = true
    isSingleMachineTranslating.value = true
    currentTranslatingLang.value = locale.originalCode

    vscodeApi.postMessage({
      type: WebViewMessageType.TRANSLATE_BY_MACHINE,
      data: {
        entryId: translationEntry.value!.id,
        originalCode: locale.originalCode,
        targetCode: locale.code,
        aiModel: selectedAIModel.value,
      },
    })
  }

  // Translate all untranslated languages by machine
  function translateAllByMachine(sourceLanguage: string) {
    // Get all non-source languages
    if (!translationEntry.value!.locales)
      return

    const availableCodes = Object.keys(translationEntry.value!.locales)
    const toTranslateLocales = availableCodes
      .filter(code => code !== sourceLanguage && !translationEntry.value!.locales[code])
      .map(code => ({ originalCode: code, code }))

    // Set global machine translation state
    isMachineTranslating.value = true

    // Translate each language by machine
    toTranslateLocales.forEach((locale) => {
      vscodeApi.postMessage({
        type: WebViewMessageType.TRANSLATE_BY_MACHINE,
        data: {
          entryId: translationEntry.value!.id,
          originalCode: locale.originalCode,
          targetCode: locale.code,
          aiModel: selectedAIModel.value,
        },
      })
    })
  }

  // Translate single entry by AI
  function translateSingleByAI(sourceLanguage: string, targetLanguage: string) {
    // Set translating status
    isAITranslating.value = true
    isSingleAITranslating.value = true
    currentTranslatingLang.value = targetLanguage
    error.value = ''

    // Get selected model
    const modelIdParts = parseModelId(selectedAIModel.value)
    const modelInfo = {
      provider: modelIdParts.provider,
      modelId: modelIdParts.modelId,
    }

    // Send message to extension
    vscodeApi.postMessage({
      type: WebViewMessageType.AI_TRANSLATE,
      data: {
        sourceText: translationEntry.value!.id,
        sourceLanguage,
        targetLanguage,
        provider: modelInfo.provider,
        modelId: modelInfo.modelId,
        entryId: translationEntry.value!.id,
      },
    })
  }

  // Translate all untranslated languages by AI
  function translateAllByAI(sourceLanguage: string) {
    // Set translating status
    isAITranslating.value = true
    isAIBatchTranslating.value = true
    error.value = ''

    // Get selected model
    const modelIdParts = parseModelId(selectedAIModel.value)
    const modelInfo = {
      provider: modelIdParts.provider,
      modelId: modelIdParts.modelId,
    }

    // Use batch translation to reduce token consumption
    if (Object.keys(translationEntry.value!.locales).length > 0) {
      // Collect all target language codes
      const targetLanguages = Object.keys(translationEntry.value!.locales)

      // Use batch translation to reduce token consumption
      vscodeApi.postMessage({
        type: WebViewMessageType.AI_BATCH_TRANSLATE,
        data: {
          sourceText: translationEntry.value!.id,
          sourceLanguage,
          targetLanguages,
          provider: modelInfo.provider,
          modelId: modelInfo.modelId,
          entryId: translationEntry.value!.id,
        },
      })
    }
  }

  // Handle machine translation result
  function handleMachineTranslateResult(
    data: TranslateByMachineResultData,
  ) {
    // 检查是否是当前正在单独翻译的语言
    if (isSingleMachineTranslating.value && data.targetLanguage === currentTranslatingLang.value) {
      isSingleMachineTranslating.value = false
      currentTranslatingLang.value = ''
    }

    // 检查是否所有翻译请求都已完成
    // 由于不知道有多少请求被发送，这里简单地重置状态
    setTimeout(() => {
      isMachineTranslating.value = false
    }, 300)

    if (data.error) {
      error.value = data.error
      return
    }

    // Update translation entry
    if (translationEntry.value && data.targetLanguage && data.result) {
      updateTranslationEntry(data.targetLanguage, data.result)
    }
  }

  // Handle AI translation result
  function handleAITranslateResult(
    data: AITranslateResultData,
  ) {
    // 检查是否是当前正在单独翻译的语言
    if (isSingleAITranslating.value && data.targetLanguage === currentTranslatingLang.value) {
      isSingleAITranslating.value = false
      currentTranslatingLang.value = ''
    }

    // 重置状态
    setTimeout(() => {
      isAITranslating.value = false
    }, 300)

    if (data.error) {
      error.value = data.error
      return
    }

    // Update translation entry
    if (translationEntry.value && data.targetLanguage && data.result) {
      updateTranslationEntry(data.targetLanguage, data.result)
    }
  }

  // Handle AI batch translation result
  function handleAIBatchTranslateResult(
    data: AIBatchTranslateResultData,
  ) {
    isAITranslating.value = false
    isAIBatchTranslating.value = false

    if (data.error) {
      error.value = data.error
      return
    }

    // Update translation entry
    if (translationEntry.value && data.results) {
      Object.entries(data.results).forEach(([langCode, translation]) => {
        updateTranslationEntry(langCode, translation as string)
      })
    }
  }

  // Set up message listeners
  function setupMessageListeners() {
    // Handle model configuration message
    vscodeApi.on(WebViewMessageType.SEND_MODEL_CONFIG, (data: { models: string }) => {
      const models = JSON.parse(data.models) as Array<ModelInfo>
      if (models && models.length > 0) {
        // Update option list
        aiModels.value = models.map(model => ({
          provider: model.provider,
          modelId: model.modelId,
        }))

        // Set default selected model
        if (aiModels.value.length > 0 && !selectedAIModel.value) {
          selectedAIModel.value = aiModels.value[0].modelId
        }
      }
    })

    // Handle machine translation result
    vscodeApi.on(WebViewMessageType.TRANSLATE_BY_MACHINE_RESULT, (data: TranslateByMachineResultData) => {
      handleMachineTranslateResult(data)
    })

    // Handle AI translation result
    vscodeApi.on(WebViewMessageType.AI_TRANSLATE_RESULT, (data: AITranslateResultData) => {
      handleAITranslateResult(data)
    })

    // Handle AI batch translation result
    vscodeApi.on(WebViewMessageType.AI_BATCH_TRANSLATE_RESULT, (data: AIBatchTranslateResultData) => {
      handleAIBatchTranslateResult(data)
    })
  }

  return {
    aiModels,
    selectedAIModel,
    isAITranslating,
    isMachineTranslating,
    isAIBatchTranslating,
    isSingleAITranslating,
    isSingleMachineTranslating,
    currentTranslatingLang,
    error,
    updateSelectedModel,
    translateByMachine,
    translateAllByMachine,
    translateSingleByAI,
    translateAllByAI,
    setupMessageListeners,
  }
}
