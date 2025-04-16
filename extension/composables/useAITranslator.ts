// 导入AI SDK
import type { LanguageModelV1 } from 'ai'
import type { Webview } from 'vscode'

import type { AIBatchTranslateData, AITranslateData, ModelConfig } from '../../types'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { createSingletonComposable, useWorkspaceFolders } from 'reactive-vscode'
import * as vscode from 'vscode'
import { WebViewMessageType } from '../../constants'
import { useTranslationsState } from '../state'
import { logger } from '../utils/logger'
import { useModelConfig } from './useModelConfig'
import { useTranslator } from './useTranslator'

/**
 * Translation options interface
 */
export interface TranslationOptions {
  entryId: string
  sourceText: string
  sourceLanguage: string
  targetLanguage: string
  model: Omit<ModelConfig, 'apiKey'>
}

/**
 * Batch translation options interface
 */
export interface BatchTranslationOptions {
  entryId: string
  sourceText: string
  sourceLanguage: string
  targetLanguages: string[]
  model: Omit<ModelConfig, 'apiKey'>
}

/**
 * AI translation composable function
 */
export const useAITranslator = createSingletonComposable(() => {
  const translator = useTranslator()
  const { getEntryById } = useTranslationsState()

  // Base Prompt
  const BASE_PROMPT = `
    User can send the content to be translated,
    and the assistant will answer the corresponding translation result,
    ensuring that it conforms to the grammar and habits of the target language,
    you can adjust the tone and style, and consider the cultural connotations and regional differences of certain words.
    As a translator, you need to translate the original text into a translation with the standard of "faithfulness", "fluency", and "elegance".
    "Faithfulness" means that the translation is faithful to the original content and intent;
    "Fluency" means that the translation should be smooth and easy to understand, and clear;
    "Elegance" means that the translation should be culturally aesthetic and linguistically graceful.
    The goal is to create a translation that is both faithful to the original work and culturally aesthetic.
  `

  // AI model list
  const AI_MODELS: Omit<ModelConfig, 'apiKey'>[] = []

  // API key mapping
  const API_KEYS: Record<string, string> = {}

  function buildModelKey(provider: string, modelId: string): string {
    return `${provider}:${modelId}`
  }

  /**
   * Update AI models and API keys
   * @param models AI model configuration
   */
  function updateAIModels(models: ModelConfig[]): void {
    if (!models || !Array.isArray(models) || models.length === 0)
      return

    // Clear the current model list
    AI_MODELS.length = 0

    // Update the API key mapping and model list
    models.forEach((model) => {
      if (model.provider && model.apiKey) {
        API_KEYS[buildModelKey(model.provider, model.modelId)] = model.apiKey
      }

      AI_MODELS.push({
        provider: model.provider,
        modelId: model.modelId,
      })
    })
  }

  /**
   * Get the available AI model list
   * @returns AI model list
   */
  async function getAvailableModels(): Promise<Omit<ModelConfig, 'apiKey'>[]> {
    const modelConfig = await useModelConfig()
    const models = await modelConfig.readModelConfig()
    updateAIModels(models)
    return [...AI_MODELS]
  }

  /**
   * Get an instance of a specific provider and model
   * @param provider Provider
   * @param modelId Model ID
   * @returns Language model instance
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

  /**
   * Get the entry information
   * @param entryId Entry ID
   * @returns Entry information
   */
  function getEntryInfo(entryId: string): {
    references: string[]
    msgctxt: string
  } {
    const entry = getEntryById(entryId)
    // Read the references file
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
   * Build a translation prompt
   * @param sourceText Source text
   * @param sourceLanguage Source language
   * @param targetLanguage Target language
   * @param references References
   * @param msgctxt Message context
   * @returns Prompt text
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
      contextInfo += `\n\nContext description: "${msgctxt}"`
    }

    if (references && references.length > 0) {
      contextInfo += `\n\nReferences: ${references.join(', \n')}`
    }

    return `
      You are a translation expert,
      please translate the following ${sourceLanguage} text exactly into ${targetLanguage},
      ${BASE_PROMPT}
      ${contextInfo}
      Source Text:
      "${sourceText}"
      Only return the translation result, do not add any other explanation or mark.
    `
  }

  /**
   * Build a batch translation prompt
   * @param sourceText Source text
   * @param sourceLanguage Source language
   * @param targetLanguages Target languages
   * @param references References
   * @param msgctxt Message context
   * @returns Prompt text
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
      contextInfo += `\n\nContext description: "${msgctxt}"`
    }

    if (references && references.length > 0) {
      contextInfo += `\n\nReferences: ${references.join(', \n')}`
    }

    const targetLanguagesStr = targetLanguages.join('、')

    return `
      You are a multi-language translation expert, 
      please translate the following ${sourceLanguage} text into ${targetLanguagesStr}.
      ${BASE_PROMPT}
      ${contextInfo}

      Source Text:
      "${sourceText}"

      Please return the result in the following format, 
      ensuring that each translation is marked with the language code:
      [targetLanguageCode] Translation content
      ...and so on

      Only return the translation result, do not add any other explanation or mark.
    `
  }

  /**
   * Translate with a specified AI model
   * @param options Translation options
   * @returns Translation result
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

      // Clean up possible quotes
      const cleanedText = text.replace(/^["']|["']$/g, '').trim()
      return cleanedText
    }
    catch (error: any) {
      logger.error(vscode.l10n.t('AI translation failed: {error}', { error: error?.message || 'Unknown error' }))
      throw new Error(vscode.l10n.t('AI translation failed: {error}', { error: error?.message || 'Unknown error' }))
    }
  }

  /**
   * Translate with a specified AI model in batch
   * @param options Batch translation options
   * @returns Return an object, with the language code as the key and the translation result as the value
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

      // Parse the multi-language result returned
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
   * Handle AI translation request
   * @param data Translation data
   * @param webview Webview instance
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
   * Handle AI batch translation request
   * @param data Batch translation data
   * @param webview Webview instance
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

      // Send error information back to webview
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
