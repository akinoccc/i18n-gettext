// 导入AI SDK
import type { LanguageModelV1 } from 'ai'
import type { Webview } from 'vscode'

import type { AIBatchTranslateData, AITranslateData, ModelConfigData } from '../constants'
import type { TranslationEntry } from '../state'
import { anthropic, createAnthropic } from '@ai-sdk/anthropic'
import { createDeepSeek, deepseek } from '@ai-sdk/deepseek'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { createSingletonComposable } from 'reactive-vscode'

import * as vscode from 'vscode'
import { WebViewMessageType } from '../constants'
import { logger } from '../utils/logger'
import { useModelConfig } from './useModelConfig'
import { useTranslator } from './useTranslator'

/**
 * AI模型接口
 */
export interface AIModel {
  provider: string
  modelId: string
  label: string
}

/**
 * 翻译选项接口
 */
export interface TranslationOptions {
  sourceText: string
  sourceLanguage: string
  targetLanguage: string
  model: AIModel
  references?: string[]
  msgctxt?: string
  entry: TranslationEntry
}

/**
 * 批量翻译选项接口
 */
export interface BatchTranslationOptions {
  sourceText: string
  sourceLanguage: string
  targetLanguages: string[]
  model: AIModel
  references?: string[]
  msgctxt?: string
  entry: TranslationEntry
}

/**
 * AI翻译组合式函数
 */
export const useAITranslator = createSingletonComposable(() => {
  const translator = useTranslator()

  // 默认 AI 模型列表
  const AI_MODELS: AIModel[] = []

  // API 密钥映射
  const API_KEYS: Record<string, string> = {}

  /**
   * 更新 AI 模型和 API 密钥
   * @param models AI模型配置
   */
  function updateAIModels(models: ModelConfigData['models']): void {
    logger.info('updateAIModels', JSON.stringify(models))
    if (!models || !Array.isArray(models) || models.length === 0)
      return

    // 清空当前模型列表
    AI_MODELS.length = 0

    // 更新 API 密钥映射和模型列表
    models.forEach((model) => {
      // 保存 API 密钥
      if (model.provider && model.apiKey) {
        API_KEYS[model.provider] = model.apiKey
      }

      // 添加到模型列表
      AI_MODELS.push({
        provider: model.provider,
        modelId: model.model,
        // 为模型创建友好名称
        label: `${model.provider[0].toUpperCase() + model.provider.slice(1)} ${model.model}`,
      })
    })
  }

  /**
   * 获取可用的AI模型列表
   * @returns AI模型列表
   */
  async function getAvailableModels(): Promise<AIModel[]> {
    const modelConfig = await useModelConfig()
    const models = await modelConfig.readModelConfig()
    logger.info(JSON.stringify(models))
    updateAIModels(models)
    return [...AI_MODELS]
  }

  /**
   * 获取特定提供商和模型的实例
   * @param provider 提供商
   * @param modelId 模型ID
   * @returns 语言模型实例
   */
  function getModelInstance(provider: string, modelId: string): LanguageModelV1 {
    logger.info(provider, modelId,JSON.stringify(API_KEYS))
    const apiKey = API_KEYS[provider]

    if (!apiKey) {
      logger.warn(vscode.l10n.t('No API key found for {provider}', { provider }))
    }

    switch (provider) {
      case 'openai':
        return createOpenAI({ apiKey })(modelId)
      case 'anthropic':
        return createAnthropic({ apiKey })(modelId)
      case 'deepseek':
        return createDeepSeek({
          apiKey,
        })(modelId)
      default:
        throw new Error(vscode.l10n.t('Unsupported provider: {provider}', { provider }))
    }
  }

  /**
   * 构建翻译提示
   * @param sourceText 源文本
   * @param sourceLanguage 源语言
   * @param targetLanguage 目标语言
   * @param references 引用
   * @param msgctxt 消息上下文
   * @returns 提示文本
   */
  function buildTranslationPrompt(
    sourceText: string,
    sourceLanguage: string,
    targetLanguage: string,
    references?: string[],
    msgctxt?: string,
  ): string {
    let contextInfo = ''

    if (msgctxt) {
      contextInfo += `\n\n上下文描述: "${msgctxt}"`
    }

    if (references && references.length > 0) {
      contextInfo += `\n\n引用的代码: ${references.join(', \n')}`
    }

    return `
      你是一个翻译专家，请将以下${sourceLanguage}文本精确翻译成${targetLanguage}，
      用户可以向助手发送需要翻译的内容，助手会回答相应的翻译结果，并确保符合目标语言的语法和习惯，你可以调整语气和风格，并考虑到某些词语的文化内涵和地区差异。
      同时作为翻译家，需将原文翻译成具有信达雅标准的译文。
      "信" 即忠实于原文的内容与意图；
      "达" 意味着译文应通顺易懂，表达清晰；
      "雅" 则追求译文的文化审美和语言的优美。
      目标是创作出既忠于原作精神，又符合目标语言文化和读者审美的翻译
      ${contextInfo}

      原文：
      "${sourceText}"

      仅返回翻译结果，不需要添加任何其他解释或标记。
    `
  }

  /**
   * 构建批量翻译提示
   * @param sourceText 源文本
   * @param sourceLanguage 源语言
   * @param targetLanguages 目标语言列表
   * @param references 引用
   * @param msgctxt 消息上下文
   * @returns 提示文本
   */
  function buildBatchTranslationPrompt(
    sourceText: string,
    sourceLanguage: string,
    targetLanguages: string[],
    references?: string[],
    msgctxt?: string,
  ): string {
    let contextInfo = ''

    if (msgctxt) {
      contextInfo += `\n\n上下文描述: "${msgctxt}"`
    }

    if (references && references.length > 0) {
      contextInfo += `\n\n引用的代码: ${references.join(', \n')}`
    }

    const targetLanguagesStr = targetLanguages.join('、')

    return `
      你是一个多语言翻译专家，请将以下${sourceLanguage}文本同时翻译成${targetLanguagesStr}。
      用户可以向助手发送需要翻译的内容，助手会回答相应的翻译结果，并确保符合目标语言的语法和习惯，你可以调整语气和风格，并考虑到某些词语的文化内涵和地区差异。
      同时作为翻译家，需将原文翻译成具有信达雅标准的译文。
      "信" 即忠实于原文的内容与意图；
      "达" 意味着译文应通顺易懂，表达清晰；
      "雅" 则追求译文的文化审美和语言的优美。
      目标是创作出既忠于原作精神，又符合目标语言文化和读者审美的翻译
      ${contextInfo}

      原文：
      "${sourceText}"

      请按以下格式返回结果，确保每种语言的翻译都用语言代码标记：
      [targetLanguageCode] 对应的翻译内容
      ...依此类推

      仅返回翻译结果，不需要添加任何其他解释或标记。
    `
  }

  /**
   * 使用指定的AI模型进行翻译
   * @param options 翻译选项
   * @returns 翻译结果
   */
  async function translateWithAI({
    sourceText,
    sourceLanguage,
    targetLanguage,
    model,
    references,
    msgctxt,
    entry,
  }: TranslationOptions): Promise<string> {
    try {
      const modelInstance = getModelInstance(model.provider, model.modelId)
      const prompt = buildTranslationPrompt(sourceText, sourceLanguage, targetLanguage, references, msgctxt)

      const { text } = await generateText({
        model: modelInstance,
        prompt,
        maxTokens: 4000,
      })

      // 清理可能的引号
      const cleanedText = text.replace(/^["']|["']$/g, '').trim()
      return cleanedText
    }
    catch (error: any) {
      logger.error(vscode.l10n.t('AI translation failed: {error}', { error: error?.message || 'Unknown error' }))
      throw new Error(vscode.l10n.t('AI translation failed: {error}', { error: error?.message || 'Unknown error' }))
    }
  }

  /**
   * 使用指定的AI模型进行批量翻译
   * @param options 批量翻译选项
   * @returns 返回一个对象，键为语言代码，值为翻译结果
   */
  async function batchTranslateWithAI({
    sourceText,
    sourceLanguage,
    targetLanguages,
    model,
    references,
    msgctxt,
    entry,
  }: BatchTranslationOptions): Promise<Record<string, string>> {
    try {
      const modelInstance = getModelInstance(model.provider, model.modelId)
      const prompt = buildBatchTranslationPrompt(sourceText, sourceLanguage, targetLanguages, references, msgctxt)

      const { text } = await generateText({
        model: modelInstance,
        prompt,
        maxTokens: 4000,
      })

      // 解析返回的多语言结果
      const translations: Record<string, string> = {}
      const lines = text.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        const match = line.match(/^\[([^\]]+)\]\s(.+)$/)
        if (match) {
          const [, langCode, translation] = match
          translations[langCode] = translation.trim()
        }
      }

      return translations
    }
    catch (error: any) {
      logger.error(vscode.l10n.t('Batch AI translation failed: {error}', { error: error?.message || 'Unknown error' }))
      throw new Error(vscode.l10n.t('Batch AI translation failed: {error}', { error: error?.message || 'Unknown error' }))
    }
  }

  /**
   * 处理AI翻译请求
   * @param data 翻译数据
   * @param webview Webview实例
   */
  async function handleAITranslate(data: AITranslateData, webview: Webview): Promise<string> {
    try {
      const result = await translateWithAI({
        sourceText: data.sourceText,
        sourceLanguage: data.sourceLanguage,
        targetLanguage: data.targetLanguage,
        model: data.model,
        references: data.references,
        msgctxt: data.msgctxt,
        entry: data.entry,
      })

      webview.postMessage({
        type: WebViewMessageType.AI_TRANSLATE_RESULT,
        data: {
          result,
          entry: JSON.stringify(data.entry),
          targetLanguage: data.targetLanguage,
        },
      })

      translator.saveTranslation(data.entry, data.targetLanguage, result)

      return result
    }
    catch (error: any) {
      logger.error(vscode.l10n.t('AI translation failed: {error}', { error: error?.message || 'Unknown error' }))

      webview.postMessage({
        type: WebViewMessageType.AI_TRANSLATE_RESULT,
        data: {
          result: '',
          entry: JSON.stringify(data.entry),
          targetLanguage: data.targetLanguage,
          error: error?.message || 'Unknown error',
        },
      })

      throw error
    }
  }

  /**
   * 处理AI批量翻译请求
   * @param data 批量翻译数据
   * @param webview Webview实例
   */
  async function handleAIBatchTranslate(data: AIBatchTranslateData, webview: Webview): Promise<Record<string, string>> {
    try {
      const results = await batchTranslateWithAI({
        sourceText: data.sourceText,
        sourceLanguage: data.sourceLanguage,
        targetLanguages: data.targetLanguages,
        model: data.model,
        references: data.references,
        msgctxt: data.msgctxt,
        entry: data.entry,
      })

        webview.postMessage({
          type: WebViewMessageType.AI_BATCH_TRANSLATE_RESULT,
          data: {
            results,
            entry: JSON.stringify(data.entry),
          },
        })

      data.targetLanguages.forEach((targetLanguage) => {
        translator.saveTranslation(data.entry, targetLanguage, results[targetLanguage])
      })

      return results
    }
    catch (error: any) {
      logger.error(vscode.l10n.t('Batch AI translation failed: {error}', { error: error?.message || 'Unknown error' }))

      // 发送错误信息回webview
      if (webview) {
        webview.postMessage({
          type: WebViewMessageType.AI_BATCH_TRANSLATE_RESULT,
          data: {
            results: {},
            entry: JSON.stringify(data.entry),
            error: error?.message || 'Unknown error',
          },
        })
      }

      throw error
    }
  }

  return {
    getAvailableModels,
    translateWithAI,
    batchTranslateWithAI,
    handleAITranslate,
    handleAIBatchTranslate,
  }
})
