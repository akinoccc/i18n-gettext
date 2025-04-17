import type { WebViewMessageType } from '../constants'
import type { ModelConfig } from './config'

/**
 * WebView message interface
 */
export interface WebViewMessage<T = any> {
  type: WebViewMessageType
  data: T
}

/**
 * Update translation message data
 */
export interface UpdateTranslationData {
  entry: string // JSON string
  locale: string
  value: string
}

/**
 * Machine translation message data
 */
export interface TranslateByMachineData {
  entryId: string
  originalCode: string
  targetCode: string
}

/**
 * Machine translation result message data
 */
export interface TranslateByMachineResultData {
  result: string
  entryId?: string
  targetLanguage: string
  error?: string
}

/**
 * Select entry message data
 */
export interface SelectEntryData {
  id: string
  locales: Record<string, string>
  references: string[]
  sourceLanguage: string
}

/**
 * Log message data
 */
export interface LogData {
  message: string
}

/**
 * AI translation message data
 */
export interface AITranslateData extends Omit<ModelConfig, 'apiKey'> {
  sourceText: string
  sourceLanguage: string
  targetLanguage: string
  entryId: string
}

/**
 * AI batch translation message data
 */
export interface AIBatchTranslateData extends Omit<ModelConfig, 'apiKey'> {
  sourceText: string
  sourceLanguage: string
  targetLanguages: string[]
  entryId: string
}

/**
 * AI translation result message data
 */
export interface AITranslateResultData {
  result: string
  entryId?: string
  targetLanguage: string
  error?: string
}

/**
 * AI batch translation result message data
 */
export interface AIBatchTranslateResultData {
  results: Record<string, string>
  entryId?: string
  error?: string
}
