import type { TranslatorMode, VSCodeConfig } from '@/store/config'
import type { AIBatchTranslateResultData, AITranslateResultData, ModelInfo, TranslateByMachineResultData, TranslationEntry } from 'types'
import { useConfigStore } from '@/store/config'
import { useTranslationStore } from '@/store/translation'
import { vscodeApi } from '@/utils'
import { WebViewMessageType } from '../../constants'
import { useTranslator } from './useTranslator'

export function useMessageListener() {
  const { setSelectedEntries } = useTranslationStore()
  const { setAiModels, setVscodeConfig, setTranslatorMode } = useConfigStore()
  const { handleMachineTranslateResult, handleAITranslateResult, handleAIBatchTranslateResult } = useTranslator()

  const setupInitWebviewListener = () => {
    vscodeApi.on(WebViewMessageType.INIT_WEBVIEW, (data: {
      vscodeConfig: string
      mode: TranslatorMode
      aiConfig: string
      selectedEntries: string
    }) => {
      setTranslatorMode(data.mode)
      setVscodeConfig(JSON.parse(data.vscodeConfig) as VSCodeConfig)
      setSelectedEntries(JSON.parse(data.selectedEntries) as TranslationEntry[])
      setAiModels(JSON.parse(data.aiConfig) as ModelInfo[])
    })
  }

  const setupSelectEntryListener = () => {
    vscodeApi.on(WebViewMessageType.UPDATE_SELECTED_ENTRY, (data: { selectedEntries: string, mode: TranslatorMode }) => {
      setSelectedEntries(JSON.parse(data.selectedEntries) as TranslationEntry[])
      setTranslatorMode(data.mode)
    })
  }

  const setupAIConfigListener = () => {
    vscodeApi.on(WebViewMessageType.UPDATE_AI_CONFIG, (data: { aiModels: string }) => {
      setAiModels(JSON.parse(data.aiModels) as ModelInfo[])
    })
  }

  const setupMachineTranslationResultListener = () => {
    vscodeApi.on(WebViewMessageType.TRANSLATE_BY_MACHINE_RESULT, (data: TranslateByMachineResultData) => {
      handleMachineTranslateResult(data)
    })
  }

  const setupAITranslationResultListener = () => {
    vscodeApi.on(WebViewMessageType.AI_TRANSLATE_RESULT, (data: AITranslateResultData) => {
      handleAITranslateResult(data)
    })
  }

  const setupAIBatchTranslationResultListener = () => {
    vscodeApi.on(WebViewMessageType.AI_BATCH_TRANSLATE_RESULT, (data: AIBatchTranslateResultData) => {
      data.targetLanguages = JSON.parse(data.targetLanguages as unknown as string)
      handleAIBatchTranslateResult(data)
    })
  }

  const setupAllListeners = () => {
    setupInitWebviewListener()
    setupSelectEntryListener()
    setupAIConfigListener()
    setupMachineTranslationResultListener()
    setupAITranslationResultListener()
    setupAIBatchTranslationResultListener()
  }

  return {
    setupAllListeners,
  }
}
