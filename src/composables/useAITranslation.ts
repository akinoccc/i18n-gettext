import type { AIBatchTranslateResultData, AITranslateResultData, ModelInfo, TranslateByMachineResultData } from '../../types'
import { ref } from 'vue'
import { WebViewMessageType } from '../../constants'
import { vscodeApi } from '../utils'
import { useTranslationEntry } from './useTranslationEntry'

export function useAITranslation() {
  const aiModels = ref<ModelInfo[]>([])
  const selectedAIModel = ref<string>('')
  const onlyTranslateUntranslated = ref(true)

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
  // 用于记录翻译失败的语言及错误信息
  const languageErrors = ref<Record<string, string>>({})
  const error = ref('')

  const { translationEntry, updateTranslationEntry, registerOnEntryChange } = useTranslationEntry()

  // 注册 translationEntry 变更事件，在条目变化时重置所有状态
  registerOnEntryChange(() => {
    resetAllTranslationStates()
  })

  function updateOnlyTranslateUntranslated(value: boolean) {
    onlyTranslateUntranslated.value = value
  }

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

  // 清除指定语言的错误状态
  function clearLanguageError(lang: string) {
    if (languageErrors.value[lang]) {
      delete languageErrors.value[lang]
    }
  }

  // 设置语言的错误状态
  function setLanguageError(lang: string, errorMsg: string) {
    languageErrors.value[lang] = errorMsg
  }

  // 获取特定语言的错误信息
  function getLanguageError(lang: string): string | undefined {
    return languageErrors.value[lang]
  }

  // 判断特定语言是否有翻译错误
  function hasLanguageError(lang: string): boolean {
    return !!languageErrors.value[lang]
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
    // 清除之前的错误状态
    clearLanguageError(locale.originalCode)

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
      .filter((code) => {
        const isSourceLanguage = code === sourceLanguage
        const isTranslated = translationEntry.value!.locales[code]
        if (onlyTranslateUntranslated.value) {
          return !isSourceLanguage && !isTranslated
        }
        return !isSourceLanguage
      })
      .map(code => ({ originalCode: code, code }))

    // 清除所有要翻译的语言的高亮状态
    toTranslateLocales.forEach((locale) => {
      clearLanguageHighlight(locale.originalCode)
      // 清除所有要翻译的语言的错误状态
      clearLanguageError(locale.originalCode)
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
    // 清除错误状态
    clearLanguageError(targetLanguage)

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
        .filter((lang) => {
          const isSourceLanguage = lang === sourceLanguage
          const isTranslated = translationEntry.value!.locales[lang]
          if (onlyTranslateUntranslated.value) {
            return !isSourceLanguage && !isTranslated
          }
          return !isSourceLanguage
        })

      // 清除所有目标语言的高亮状态
      targetLanguages.forEach((lang) => {
        clearLanguageHighlight(lang)
        // 清除所有目标语言的错误状态
        clearLanguageError(lang)
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
      // 记录特定语言的错误
      if (data.targetLanguage) {
        setLanguageError(data.targetLanguage, data.error)
      }
      // 全局错误仍然保留
      error.value = data.error
      return
    }

    // 翻译成功，清除错误信息
    error.value = ''

    // 如果有目标语言，清除该语言的错误状态
    if (data.targetLanguage) {
      clearLanguageError(data.targetLanguage)
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
      // 记录特定语言的错误
      if (data.targetLanguage) {
        setLanguageError(data.targetLanguage, data.error)
      }
      // 全局错误仍然保留
      error.value = data.error
      return
    }

    // 翻译成功，清除错误信息
    error.value = ''

    // 如果有目标语言，清除该语言的错误状态
    if (data.targetLanguage) {
      clearLanguageError(data.targetLanguage)
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
      // 对于批量翻译，如果失败，我们设置全局错误，但不为单独语言设置错误
      error.value = data.error
      return
    }

    // 翻译成功，清除错误信息
    error.value = ''

    // Update translation entry
    if (translationEntry.value && data.results) {
      Object.entries(data.results).forEach(([langCode, translation]) => {
        // 清除该语言的错误状态
        clearLanguageError(langCode)

        updateTranslationEntry(langCode, translation as string)
        // 标记为最近翻译完成
        markLanguageAsRecentlyTranslated(langCode)
      })
    }
  }

  // 重置所有翻译状态
  function resetAllTranslationStates() {
    // 重置高亮状态
    recentlyTranslatedLanguages.value = {}
    // 重置错误状态
    languageErrors.value = {}
    // 重置翻译中状态
    languageTranslatingState.value = {}
    // 重置全局翻译状态
    isAITranslating.value = false
    isMachineTranslating.value = false
    isAIBatchTranslating.value = false
    isSingleAITranslating.value = false
    isSingleMachineTranslating.value = false
    currentTranslatingLang.value = ''
    error.value = ''
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
    onlyTranslateUntranslated,
    updateOnlyTranslateUntranslated,
    isAITranslating,
    isMachineTranslating,
    isAIBatchTranslating,
    isSingleAITranslating,
    isSingleMachineTranslating,
    currentTranslatingLang,
    languageTranslatingState,
    isLanguageTranslating,
    isLanguageRecentlyTranslated,
    hasLanguageError,
    getLanguageError,
    clearLanguageHighlight,
    clearLanguageError,
    resetAllTranslationStates,
    error,
    updateSelectedModel,
    translateByMachine,
    translateAllByMachine,
    translateSingleByAI,
    translateAllByAI,
    setupMessageListeners,
  }
}
