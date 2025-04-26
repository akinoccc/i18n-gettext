import type {
  AIBatchTranslateResultData,
  AITranslateResultData,
  TranslateByMachineResultData,
  TranslationEntry,
} from '../../typings'
import { useConfigStore } from '@/store/config'
import { TranslationState, useTranslationStore } from '@/store/translation'
import { storeToRefs } from 'pinia'
import { WebViewMessageType } from '../../constants'
import { vscodeApi } from '../utils'

export function useTranslator() {
  const { vscodeConfig, selectedModel } = storeToRefs(useConfigStore())
  const { selectedEntries } = storeToRefs(useTranslationStore())
  const { setLocaleState } = useTranslationStore()

  // Translate single entry by machine
  function translateByMachine(
    locale: { originalCode: string, code: string },
    entry: TranslationEntry,
  ) {
    const targetEntry = entry

    setLocaleState({
      entry: targetEntry,
      state: TranslationState.Translating,
      type: 'machine',
      locales: [locale.originalCode],
    })

    vscodeApi.postMessage({
      type: WebViewMessageType.TRANSLATE_BY_MACHINE,
      data: {
        entryId: targetEntry!.id,
        msgctxt: targetEntry.msgctxt,
        originalLanguageCode: locale.originalCode,
        targetLanguage: locale.code,
      },
    })
  }

  // Translate all untranslated languages by machine
  function translateAllByMachine(sourceLanguage: string, entry: TranslationEntry, onTranslated?: (languageCode: string, isSuccess: boolean) => void) {
    const targetEntry = entry

    // Get all non-source languages
    if (!targetEntry!.locales)
      return

    const availableCodes = Object.keys(targetEntry!.locales)
    const toTranslateLocales = availableCodes
      .filter((code) => {
        const isSourceLanguage = code === sourceLanguage
        const isTranslated = targetEntry!.locales[code]
        if (vscodeConfig.value!.onlyTranslateUntranslated) {
          return !isSourceLanguage && !isTranslated
        }
        return !isSourceLanguage
      })
      .map(code => ({ originalCode: code, code }))

    // 如果没有需要翻译的语言，直接返回
    if (toTranslateLocales.length === 0) {
      return
    }

    // Translate each language by machine
    toTranslateLocales.forEach((locale) => {
      setLocaleState({
        entry: targetEntry,
        state: TranslationState.Translating,
        type: 'machine',
        locales: [locale.originalCode],
      })

      vscodeApi.postMessage({
        type: WebViewMessageType.TRANSLATE_BY_MACHINE,
        data: {
          entryId: targetEntry!.id,
          msgctxt: targetEntry.msgctxt,
          originalLanguageCode: locale.originalCode,
          targetLanguage: locale.code,
        },
      })

      // 监听翻译结果事件
      const handleTranslationResult = (event: MessageEvent) => {
        const message = event.data
        if (
          message.type === WebViewMessageType.TRANSLATE_BY_MACHINE_RESULT
          && message.data.entryId === targetEntry.id
          && message.data.msgctxt === targetEntry.msgctxt
        ) {
          // 调用回调函数通知进度更新
          if (onTranslated) {
            // 对于批量翻译，需要为每个语言调用回调
            const { result, error } = message.data
            const isSuccess = !error && result

            onTranslated(locale.originalCode, isSuccess)
          }

          // 移除事件监听器
          window.removeEventListener('message', handleTranslationResult)
        }
      }

      // 添加事件监听器
      window.addEventListener('message', handleTranslationResult)
    })
  }

  // Translate single entry by AI
  function translateSingleByAI(sourceLanguage: string, targetLanguage: string, entry: TranslationEntry) {
    const targetEntry = entry

    setLocaleState({
      entry: targetEntry,
      state: TranslationState.Translating,
      type: 'ai',
      locales: [targetLanguage],
    })

    // Send message to extension
    vscodeApi.postMessage({
      type: WebViewMessageType.AI_TRANSLATE,
      data: {
        sourceText: targetEntry!.id,
        sourceLanguage,
        targetLanguage,
        provider: selectedModel.value.provider,
        modelId: selectedModel.value.modelId,
        entryId: targetEntry!.id,
        msgctxt: targetEntry.msgctxt,
      },
    })
  }

  // Translate all untranslated languages by AI
  function translateAllByAI(sourceLanguage: string, entry: TranslationEntry, onTranslated?: (languageCode: string, isSuccess: boolean) => void) {
    const targetEntry = entry

    // Use batch translation to reduce token consumption
    if (Object.keys(targetEntry!.locales).length > 0) {
      // Collect all target language codes
      const targetLanguages = Object.keys(targetEntry!.locales)
        .filter((lang) => {
          const isSourceLanguage = lang === sourceLanguage
          const isTranslated = targetEntry!.locales[lang]
          if (vscodeConfig.value?.onlyTranslateUntranslated) {
            return !isSourceLanguage && !isTranslated
          }
          return !isSourceLanguage
        })

      // 如果没有需要翻译的语言，直接返回
      if (targetLanguages.length === 0) {
        return
      }

      setLocaleState({
        entry: targetEntry,
        state: TranslationState.Translating,
        type: 'ai',
        locales: targetLanguages,
      })

      // Use batch translation to reduce token consumption
      vscodeApi.postMessage({
        type: WebViewMessageType.AI_BATCH_TRANSLATE,
        data: {
          sourceText: targetEntry!.id,
          sourceLanguage,
          targetLanguages,
          provider: selectedModel.value.provider,
          modelId: selectedModel.value.modelId,
          entryId: targetEntry!.id,
          msgctxt: targetEntry?.msgctxt,
        },
      })

      // 监听翻译结果事件
      const handleTranslationResult = (event: MessageEvent) => {
        const message = event.data
        if (
          message.type === WebViewMessageType.AI_BATCH_TRANSLATE_RESULT
          && message.data.entryId === targetEntry.id
          && message.data.msgctxt === targetEntry.msgctxt
        ) {
          // 调用回调函数通知进度更新
          if (onTranslated) {
            // 对于批量翻译，需要为每个语言调用回调
            const { targetLanguages, results, error } = message.data
            const isSuccess = !error && Object.keys(results || {}).length > 0
            // 检查每个语言的翻译结果
            targetLanguages.forEach((langCode: string) => {
              const langSuccess = isSuccess && !!results[langCode]
              onTranslated(langCode, langSuccess)
            })
          }

          // 移除事件监听器
          window.removeEventListener('message', handleTranslationResult)
        }
      }

      // 添加事件监听器
      window.addEventListener('message', handleTranslationResult)
    }
  }

  // Handle machine translation result
  function handleMachineTranslateResult(
    data: TranslateByMachineResultData,
  ) {
    const entryIdx = selectedEntries.value.findIndex(item =>
      item.id === data.entryId
      && item?.msgctxt === data.msgctxt,
    )

    if (entryIdx === -1 || data.error || !data.result) {
      setLocaleState({
        entry: selectedEntries.value[entryIdx],
        type: 'machine',
        locales: [data.targetLanguage],
        state: TranslationState.Failed,
      })
      return
    }

    setLocaleState({
      entry: selectedEntries.value[entryIdx],
      type: 'machine',
      locales: [data.targetLanguage],
      state: TranslationState.Translated,
    })

    // Update translation entry
    selectedEntries.value[entryIdx].locales[data.targetLanguage] = data.result
  }

  // Handle AI translation result
  function handleAITranslateResult(
    data: AITranslateResultData,
  ) {
    const entryIdx = selectedEntries.value.findIndex(item =>
      item.id === data.entryId
      && item?.msgctxt === data.msgctxt,
    )

    if (entryIdx === -1 || data.error || !data.result) {
      setLocaleState({
        entry: selectedEntries.value[entryIdx],
        type: 'ai',
        locales: [data.targetLanguage],
        state: TranslationState.Failed,
      })
      return
    }

    // Update translation entry
    setLocaleState({
      entry: selectedEntries.value[entryIdx],
      type: 'ai',
      locales: [data.targetLanguage],
      state: TranslationState.Translated,
    })

    selectedEntries.value[entryIdx].locales[data.targetLanguage] = data.result
  }

  // Handle AI batch translation result
  function handleAIBatchTranslateResult(
    data: AIBatchTranslateResultData,
  ) {
    const entryIdx = selectedEntries.value.findIndex(item =>
      item.id === data.entryId
      && item?.msgctxt === data.msgctxt,
    )

    if (entryIdx === -1 || data.error || !Object.keys(data.results).length) {
      setLocaleState({
        entry: selectedEntries.value[entryIdx],
        state: TranslationState.Failed,
        type: 'ai',
        locales: data.targetLanguages,
      })
      return
    }

    // Update translation entry
    setLocaleState({
      entry: selectedEntries.value[entryIdx],
      type: 'ai',
      locales: data.targetLanguages,
      state: TranslationState.Translated,
    })

    Object.entries(data.results).forEach(([langCode, translation]) => {
      selectedEntries.value[entryIdx].locales[langCode] = translation as string
    })
  }

  return {
    translateByMachine,
    translateAllByMachine,
    translateSingleByAI,
    translateAllByAI,
    handleMachineTranslateResult,
    handleAITranslateResult,
    handleAIBatchTranslateResult,
  }
}
