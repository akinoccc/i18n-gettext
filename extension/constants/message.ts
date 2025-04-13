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
