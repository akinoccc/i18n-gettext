import type { TranslationEntry } from '../state'

/**
 * WebView消息类型枚举
 */
export enum WebViewMessageType {
  // 转到引用
  GO_TO_REFERENCE = 'i18n-gettext.goToReference',
  // 更新翻译
  UPDATE_TRANSLATION = 'i18n-gettext.updateTranslation',
  // 机器翻译
  TRANSLATE_BY_MACHINE = 'i18n-gettext.translateByMachine',
  // 选择条目
  SELECT_ENTRY = 'i18n-gettext.selectEntry',
  // 发送模型配置
  SEND_MODEL_CONFIG = 'i18n-gettext.sendModelConfig',
  // 日志
  LOG = 'i18n-gettext.log',
  // AI翻译
  AI_TRANSLATE = 'i18n-gettext.aiTranslate',
  // AI批量翻译
  AI_BATCH_TRANSLATE = 'i18n-gettext.aiBatchTranslate',
  // AI翻译结果
  AI_TRANSLATE_RESULT = 'i18n-gettext.aiTranslateResult',
  // AI批量翻译结果
  AI_BATCH_TRANSLATE_RESULT = 'i18n-gettext.aiBatchTranslateResult',
}

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
  [key: string]: any
}

/**
 * 模型配置消息数据
 */
export interface ModelConfigData {
  models: Array<{
    provider: string
    model: string
    apiKey: string
  }>
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
export interface AITranslateData {
  sourceText: string
  sourceLanguage: string
  targetLanguage: string
  model: {
    provider: string
    modelId: string
    label: string
  }
  references?: string[]
  msgctxt?: string
  entry: TranslationEntry
}

/**
 * AI批量翻译消息数据
 */
export interface AIBatchTranslateData {
  sourceText: string
  sourceLanguage: string
  targetLanguages: string[]
  model: {
    provider: string
    modelId: string
    label: string
  }
  references?: string[]
  msgctxt?: string
  entry: TranslationEntry
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
