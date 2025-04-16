import type { TranslationEntry } from '../extension/state'

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
