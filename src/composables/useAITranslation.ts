import type { AIBatchTranslateResultData, AITranslateResultData, ModelInfo, TranslateByMachineResultData } from '../../types'
import { ref } from 'vue'
import { WebViewMessageType } from '../../constants'
import { vscodeApi } from '../utils'
import { useTranslationEntry } from './useTranslationEntry'

export function useAITranslation() {
  const aiModels = ref<ModelInfo[]>([])
  const selectedAIModel = ref<string>('')
  // 全局状态
  const isAITranslating = ref(false)
  const isMachineTranslating = ref(false)
  const isAIBatchTranslating = ref(false)
  // 单个条目状态
  const isSingleAITranslating = ref(false)
  const isSingleMachineTranslating = ref(false)
  const currentTranslatingLang = ref<string>('')
  // 用于存储每个语言的翻译状态
  const languageTranslatingState = ref<Record<string, { ai: boolean, machine: boolean }>>({})
  // 最近翻译完成的语言，用于高亮显示
  const recentlyTranslatedLanguages = ref<Record<string, boolean>>({})
  const error = ref('')

  const { translationEntry, updateTranslationEntry } = useTranslationEntry()

  // 更新特定语言的翻译状态
  function updateLanguageTranslatingState(lang: string, type: 'ai' | 'machine', isTranslating: boolean) {
    if (!languageTranslatingState.value[lang]) {
      languageTranslatingState.value[lang] = { ai: false, machine: false }
    }

    languageTranslatingState.value[lang][type] = isTranslating
  }

  // 检查指定语言是否正在翻译
  function isLanguageTranslating(lang: string, type?: 'ai' | 'machine'): boolean {
    if (!languageTranslatingState.value[lang])
      return false

    if (type) {
      return languageTranslatingState.value[lang][type]
    }

    return languageTranslatingState.value[lang].ai || languageTranslatingState.value[lang].machine
  }

  // 设置语言为最近翻译完成状态，用于高亮显示
  function markLanguageAsRecentlyTranslated(lang: string) {
    recentlyTranslatedLanguages.value[lang] = true
  }

  // 清除指定语言的高亮状态
  function clearLanguageHighlight(lang: string) {
    if (recentlyTranslatedLanguages.value[lang]) {
      recentlyTranslatedLanguages.value[lang] = false
    }
  }

  // 检查语言是否是最近翻译完成的
  function isLanguageRecentlyTranslated(lang: string): boolean {
    return !!recentlyTranslatedLanguages.value[lang]
  }

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
    // 清除之前的高亮状态
    clearLanguageHighlight(locale.originalCode)

    isMachineTranslating.value = true
    isSingleMachineTranslating.value = true
    updateLanguageTranslatingState(locale.originalCode, 'machine', true)

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

    // 清除所有要翻译的语言的高亮状态
    toTranslateLocales.forEach((locale) => {
      clearLanguageHighlight(locale.originalCode)
    })

    // Set global machine translation state
    isMachineTranslating.value = true

    // Translate each language by machine
    toTranslateLocales.forEach((locale) => {
      // 设置每个语言的翻译状态
      updateLanguageTranslatingState(locale.originalCode, 'machine', true)

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
    // 清除高亮状态
    clearLanguageHighlight(targetLanguage)

    // Set translating status
    isAITranslating.value = true
    isSingleAITranslating.value = true
    updateLanguageTranslatingState(targetLanguage, 'ai', true)
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
        .filter(lang => lang !== sourceLanguage)

      // 清除所有目标语言的高亮状态
      targetLanguages.forEach((lang) => {
        clearLanguageHighlight(lang)
      })

      // 设置每个目标语言的AI翻译状态
      targetLanguages.forEach((lang) => {
        if (lang !== sourceLanguage) {
          updateLanguageTranslatingState(lang, 'ai', true)
        }
      })

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
    // 更新特定语言的翻译状态
    if (data.targetLanguage) {
      updateLanguageTranslatingState(data.targetLanguage, 'machine', false)
    }

    // 检查是否所有机器翻译都已完成
    const anyLanguageStillTranslating = Object.values(languageTranslatingState.value)
      .some(state => state.machine)

    if (!anyLanguageStillTranslating) {
      isMachineTranslating.value = false
      isSingleMachineTranslating.value = false
    }

    if (data.error) {
      error.value = data.error
      return
    }

    // Update translation entry
    if (translationEntry.value && data.targetLanguage && data.result) {
      updateTranslationEntry(data.targetLanguage, data.result)
      // 标记为最近翻译完成
      markLanguageAsRecentlyTranslated(data.targetLanguage)
    }
  }

  // Handle AI translation result
  function handleAITranslateResult(
    data: AITranslateResultData,
  ) {
    // 更新特定语言的AI翻译状态
    if (data.targetLanguage) {
      updateLanguageTranslatingState(data.targetLanguage, 'ai', false)
    }

    // 检查是否所有AI翻译都已完成
    const anyLanguageStillTranslating = Object.values(languageTranslatingState.value)
      .some(state => state.ai)

    if (!anyLanguageStillTranslating) {
      isAITranslating.value = false
      isSingleAITranslating.value = false
    }

    if (data.error) {
      error.value = data.error
      return
    }

    // Update translation entry
    if (translationEntry.value && data.targetLanguage && data.result) {
      updateTranslationEntry(data.targetLanguage, data.result)
      // 标记为最近翻译完成
      markLanguageAsRecentlyTranslated(data.targetLanguage)
    }
  }

  // Handle AI batch translation result
  function handleAIBatchTranslateResult(
    data: AIBatchTranslateResultData,
  ) {
    // 重置所有语言的AI翻译状态
    Object.keys(languageTranslatingState.value).forEach((lang) => {
      updateLanguageTranslatingState(lang, 'ai', false)
    })

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
        // 标记为最近翻译完成
        markLanguageAsRecentlyTranslated(langCode)
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
    languageTranslatingState,
    isLanguageTranslating,
    isLanguageRecentlyTranslated,
    clearLanguageHighlight,
    error,
    updateSelectedModel,
    translateByMachine,
    translateAllByMachine,
    translateSingleByAI,
    translateAllByAI,
    setupMessageListeners,
  }
}
