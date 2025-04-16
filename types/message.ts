import type { WebViewMessageType } from '../constants'
import type { ModelConfig } from './config'

/**
 * WebView消息接口
 */
export interface WebViewMessage<T = any> {
  type: WebViewMessageType
  data: T
}

/**
 * 更新翻译消息数据
 */
export interface UpdateTranslationData {
  entry: string // JSON字符串
  locale: string
  value: string
}

/**
 * 机器翻译消息数据
 */
export interface TranslateByMachineData {
  entry: string // JSON字符串
  originalCode: string
  targetCode: string
}

/**
 * 选择条目消息数据
 */
export interface SelectEntryData {
  id: string
  locales: Record<string, string>
  references: string[]
  sourceLanguage: string
}

/**
 * 日志消息数据
 */
export interface LogData {
  message: string
}

/**
 * AI翻译消息数据
 */
export interface AITranslateData extends Omit<ModelConfig, 'apiKey'> {
  sourceText: string
  sourceLanguage: string
  targetLanguage: string
  entryId: string
}

/**
 * AI批量翻译消息数据
 */
export interface AIBatchTranslateData extends Omit<ModelConfig, 'apiKey'> {
  sourceText: string
  sourceLanguage: string
  targetLanguages: string[]
  entryId: string
}

/**
 * AI翻译结果消息数据
 */
export interface AITranslateResultData {
  result: string
  entryId?: string
  targetLanguage: string
  error?: string
}

/**
 * AI批量翻译结果消息数据
 */
export interface AIBatchTranslateResultData {
  results: Record<string, string>
  entryId?: string
  error?: string
}
