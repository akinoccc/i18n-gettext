import type { AIBatchTranslateResultData, AITranslateResultData, ModelInfo, TranslationEntry } from 'types'
import { ref } from 'vue'
import { WebViewMessageType } from '../../constants'
import { useTranslationEntry } from './useTranslationEntry'
import { useVscodeApi } from './useVscodeApi'

export function useAITranslation() {
  const vscodeApi = useVscodeApi()
  const aiModels = ref<ModelInfo[]>([])
  const selectedAIModel = ref<string>('')
  const isTranslating = ref(false)
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

  // Translate all untranslated languages by machine
  function translateAllByMachine(sourceLanguage: string) {
    // Get all non-source languages
    if (!translationEntry.value.locales)
      return

    const availableCodes = Object.keys(translationEntry.value.locales)
    const toTranslateLocales = availableCodes
      .filter(code => code !== sourceLanguage && !translationEntry.value.locales[code])
      .map(code => ({ originalCode: code, code }))

    // Translate each language by machine
    toTranslateLocales.forEach((locale) => {
      translateByMachine(locale)
    })
  }

  // Translate all untranslated languages by AI
  function translateAllByAI(sourceLanguage: string) {
    // Set translating status
    isTranslating.value = true
    error.value = ''

    // Get selected model
    const modelIdParts = parseModelId(selectedAIModel.value)
    const modelInfo = {
      provider: modelIdParts.provider,
      modelId: modelIdParts.modelId,
    }

    // Use batch translation to reduce token consumption
    if (Object.keys(translationEntry.value.locales).length > 0) {
      // Collect all target language codes
      const targetLanguages = Object.keys(translationEntry.value.locales)

      // Use batch translation to reduce token consumption
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
      // If there is only one language, use single translation
      const locale = Object.keys(translationEntry.value.locales)[0]

      // Send message to extension
      vscodeApi.postMessage({
        type: WebViewMessageType.AI_TRANSLATE,
        data: {
          sourceText: translationEntry.value.id,
          sourceLanguage,
          targetLanguage: locale,
          provider: modelInfo.provider,
          modelId: modelInfo.modelId,
          entryId: translationEntry.value.id,
        },
      })
    }
  }

  // Handle AI translation result
  function handleAITranslateResult(
    data: AITranslateResultData,
  ) {
    isTranslating.value = false

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
    isTranslating.value = false

    if (data.error) {
      error.value = data.error
      return
    }

    // Update translation entry
    if (translationEntry.value && data.results) {
      Object.entries(data.results).forEach(([langCode, translation]) => {
        updateTranslationEntry(langCode, translation)
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
    isTranslating,
    error,
    updateSelectedModel,
    translateByMachine,
    translateAllByMachine,
    translateAllByAI,
    setupMessageListeners,
  }
}
