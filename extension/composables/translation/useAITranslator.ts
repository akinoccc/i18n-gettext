// 导入AI SDK
import type { LanguageModelV1 } from 'ai'
import type { Webview } from 'vscode'

import type { AIBatchTranslateData, AITranslateData, ModelConfig } from '../../../types'
import { readFileSync } from 'node:fs'
import path from 'node:path'
// 导入所有AI SDK
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createAzure } from '@ai-sdk/azure'
import { createCerebras } from '@ai-sdk/cerebras'
import { createCohere } from '@ai-sdk/cohere'
import { createDeepInfra } from '@ai-sdk/deepinfra'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createFireworks } from '@ai-sdk/fireworks'
import { createVertex } from '@ai-sdk/google-vertex'
import { createGroq } from '@ai-sdk/groq'
import { createMistral } from '@ai-sdk/mistral'
import { createOpenAI } from '@ai-sdk/openai'
import { createPerplexity } from '@ai-sdk/perplexity'
import { createTogetherAI } from '@ai-sdk/togetherai'
import { createXai } from '@ai-sdk/xai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import { createOllama } from 'ollama-ai-provider'
import { createQwen } from 'qwen-ai-provider'
import { createSingletonComposable, useWorkspaceFolders } from 'reactive-vscode'
import * as vscode from 'vscode'
import { WebViewMessageType } from '../../../constants'
import { logger } from '../../utils/logger'
import { localesConfig } from '../config'
import { useAIConfig } from '../config/useAIConfig'
import { usePoEditor } from '../po'
import { useTranslationsState } from '../state'

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
  const poEditor = usePoEditor()
  const { getEntryById } = useTranslationsState()

  const BASE_PROMPT = `
    Translate faithfully, fluently and elegantly. Follow these rules:

    # Whitespace Rules
      - Add space between non-Latin (CJK/Arabic) and Latin scripts:
        JP: "Reactを使う" → "React を使う"
        KO: "Node.js설치" → "Node.js 설치"
        TH: "ติดตั้งPython3.9" → "ติดตั้ง Python 3.9"
      - Exceptions: Numbers/Units/Operators (200GB硬盘 → 200GB 硬盘)

    # Language Specific
      - CJK: Use native punctuation and spacing
      - ZH: 「正确示例」
      - JA: を適用
      - KO: 조사 spacing
      - RTL: Maintain text direction (نظام iOS الجديد)

    # Output
      - Only return translation
      - No explanations
      - Clean formatting
`
  const additionalPrompts: string[] = []

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
    const modelConfig = await useAIConfig()
    const { ai: models, additionalPrompts } = await modelConfig.readAIConfig()
    updateAIModels(models)
    additionalPrompts.push(...additionalPrompts)
    return [...AI_MODELS]
  }

  /**
   * Get an instance of a specific provider and model
   * @param provider Provider
   * @param modelId Model ID
   * @returns Language model instance
   */
  function getModelInstance(options: ModelConfig): LanguageModelV1 {
    const { provider, modelId, baseURL } = options
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
      case 'xai':
        return createXai({
          apiKey,
        })(modelId)
      case 'amazon-bedrock':
        return createAmazonBedrock({
          accessKeyId: apiKey.split(':')[0],
          secretAccessKey: apiKey.split(':')[1],
          region: 'us-east-1', // 默认区域，可以从配置中读取
        })(modelId)
      case 'azure':
        return createAzure({
          apiKey,
          baseURL: 'https://api.cognitive.microsoft.com', // 默认端点，可以从配置中读取
        })(modelId)
      case 'cerebras':
        return createCerebras({
          apiKey,
        })(modelId)
      case 'cohere':
        return createCohere({
          apiKey,
        })(modelId)
      case 'deepinfra':
        return createDeepInfra({
          apiKey,
        })(modelId)
      case 'fireworks':
        return createFireworks({
          apiKey,
        })(modelId)
      case 'groq':
        return createGroq({
          apiKey,
        })(modelId)
      case 'mistral':
        return createMistral({
          apiKey,
        })(modelId)
      case 'perplexity':
        return createPerplexity({
          apiKey,
        })(modelId)
      case 'togetherai':
        return createTogetherAI({
          apiKey,
        })(modelId)
      case 'google-vertex': {
        // Google Vertex AI需要特殊的认证方式，这里假设用户在apiKey中提供了完整的JSON字符串
        const credentials = JSON.parse(apiKey)
        return createVertex({
          project: credentials.project_id,
          location: credentials.location || 'us-central1',
          googleAuthOptions: {
            credentials,
          },
        })(modelId)
      }
      case 'ollama':
        return createOllama({
          baseURL,
        })(modelId)
      case 'qwen':
        return createQwen({
          apiKey,
          baseURL,
        })(modelId)
      case 'open-router':
        return createOpenRouter({
          apiKey,
          baseURL,
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
      const content = readFileSync(path.join(folder?.uri.fsPath || '', path.join(localesConfig.value.root, refPath)), 'utf-8')
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
      ${additionalPrompts.join('\n')}
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
      ${additionalPrompts.join('\n')}
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
      const modelInstance = getModelInstance(model)
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
      const modelInstance = getModelInstance(model)
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

      await poEditor.save(data.entryId, data.targetLanguage, result)

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
        poEditor.save(data.entryId, targetLanguage, results[targetLanguage])
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
