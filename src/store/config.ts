import type { ModelInfo } from '../../types'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type TranslatorMode = 'single' | 'batch'

export interface VSCodeConfig {
  mode: TranslatorMode
  sourceLanguage: string
  onlyTranslateUntranslated: boolean
}

export const useConfigStore = defineStore('config', () => {
  const translatorMode = ref<TranslatorMode>()
  const setTranslatorMode = (mode: TranslatorMode) => {
    translatorMode.value = mode
  }

  // Available AI models
  const aiModels = ref<ModelInfo[]>([])
  const setAiModels = (models: ModelInfo[]) => {
    aiModels.value = models
  }

  // Selected AI model
  const selectedModel = ref<{ provider: string, modelId: string }>({
    provider: '',
    modelId: '',
  })
  const setSelectedModel = (model: ModelInfo) => {
    selectedModel.value = {
      provider: model.provider,
      modelId: model.modelId,
    }
  }
  watch(aiModels, (newModels) => {
    if (newModels.length && !selectedModel.value.provider) {
      setSelectedModel(newModels[0])
    }
  }, { immediate: true, deep: true })

  // Source language
  const vscodeConfig = ref<VSCodeConfig>()
  const setVscodeConfig = (config: VSCodeConfig) => {
    vscodeConfig.value = config
  }

  const setOnlyTranslateUntranslated = (value: boolean) => {
    vscodeConfig.value!.onlyTranslateUntranslated = value
  }

  return {
    translatorMode,
    setTranslatorMode,
    aiModels,
    setAiModels,
    selectedModel,
    setSelectedModel,
    vscodeConfig,
    setVscodeConfig,
    setOnlyTranslateUntranslated,
  }
})
