// 导入AI SDK
import type { LanguageModelV1 } from 'ai'
import type { Webview } from 'vscode'

import type { AIBatchTranslateData, AITranslateData, ModelConfig } from '../../types'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { anthropic, createAnthropic } from '@ai-sdk/anthropic'
import { createDeepSeek, deepseek } from '@ai-sdk/deepseek'

import { createOpenAI, openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { createSingletonComposable, useWorkspaceFolders } from 'reactive-vscode'
import * as vscode from 'vscode'
import { WebViewMessageType } from '../../constants'
import { useTranslationsState } from '../state'
import { logger } from '../utils/logger'
import { useModelConfig } from './useModelConfig'
import { useTranslator } from './useTranslator'

/**
 * 翻译选项接口
 */
export interface TranslationOptions {
  entryId: string
  sourceText: string
  sourceLanguage: string
  targetLanguage: string
  model: Omit<ModelConfig, 'apiKey'>
}

/**
 * 批量翻译选项接口
 */
export interface BatchTranslationOptions {
  entryId: string
  sourceText: string
  sourceLanguage: string
  targetLanguages: string[]
  model: Omit<ModelConfig, 'apiKey'>
}

/**
 * AI翻译组合式函数
 */
export const useAITranslator = createSingletonComposable(() => {
  const translator = useTranslator()
  const { getEntryById } = useTranslationsState()
  // 默认 AI 模型列表
  const AI_MODELS: Omit<ModelConfig, 'apiKey'>[] = []

  // API 密钥映射
  const API_KEYS: Record<string, string> = {}

  function buildModelKey(provider: string, modelId: string): string {
    return `${provider}:${modelId}`
  }

  /**
   * 更新 AI 模型和 API 密钥
   * @param models AI模型配置
   */
  function updateAIModels(models: ModelConfig[]): void {
    if (!models || !Array.isArray(models) || models.length === 0)
      return

    // 清空当前模型列表
    AI_MODELS.length = 0

    // 更新 API 密钥映射和模型列表
    models.forEach((model) => {
      // 保存 API 密钥
      if (model.provider && model.apiKey) {
        API_KEYS[buildModelKey(model.provider, model.modelId)] = model.apiKey
      }

      // 添加到模型列表
      AI_MODELS.push({
        provider: model.provider,
        modelId: model.modelId,
      })
    })
  }

  /**
   * 获取可用的AI模型列表
   * @returns AI模型列表
   */
  async function getAvailableModels(): Promise<Omit<ModelConfig, 'apiKey'>[]> {
    const modelConfig = await useModelConfig()
    const models = await modelConfig.readModelConfig()
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
    const apiKey = API_KEYS[buildModelKey(provider, modelId)]

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

  function getEntryInfo(entryId: string): {
    references: string[]
    msgctxt: string
  } {
    const entry = getEntryById(entryId)
    // 读取 references 文件
    const references: string[] = []
    for (const ref of entry?.references || []) {
      const folder = useWorkspaceFolders().value?.[0]
      const refPath = ref.includes(':') ? ref.slice(0, ref.lastIndexOf(':')) : ref
      const content = readFileSync(path.join(folder?.uri.fsPath || '', refPath), 'utf-8')
      references.push(content)
    }
    return {
      references,
      msgctxt: entry?.msgctxt || '',
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
    entryId,
  }: TranslationOptions): Promise<string> {
    try {
      const modelInstance = getModelInstance(model.provider, model.modelId)
      const { references, msgctxt } = getEntryInfo(entryId)
      const prompt = buildTranslationPrompt(
        sourceText,
        sourceLanguage,
        targetLanguage,
        references,
        msgctxt,
      )

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
    entryId,
  }: BatchTranslationOptions): Promise<Record<string, string>> {
    try {
      const { references, msgctxt } = getEntryInfo(entryId)
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
        model: {
          provider: data.provider,
          modelId: data.modelId,
        },
        entryId: data.entryId,
      })

      await webview.postMessage({
        type: WebViewMessageType.AI_TRANSLATE_RESULT,
        data: {
          result,
          entryId: data.entryId,
          targetLanguage: data.targetLanguage,
        },
      })

      translator.saveTranslation(data.entryId, data.targetLanguage, result)

      return result
    }
    catch (error: any) {
      logger.error(vscode.l10n.t('AI translation failed: {error}', { error: error?.message || 'Unknown error' }))

      webview.postMessage({
        type: WebViewMessageType.AI_TRANSLATE_RESULT,
        data: {
          result: '',
          entryId: data.entryId,
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
        model: {
          provider: data.provider,
          modelId: data.modelId,
        },
        entryId: data.entryId,
      })

      webview.postMessage({
        type: WebViewMessageType.AI_BATCH_TRANSLATE_RESULT,
        data: {
          results,
          entryId: data.entryId,
        },
      })

      data.targetLanguages.forEach((targetLanguage) => {
        translator.saveTranslation(data.entryId, targetLanguage, results[targetLanguage])
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
            entryId: data.entryId,
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
