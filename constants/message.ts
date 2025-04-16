/**
 * WebView message type enumeration
 */
export enum WebViewMessageType {
  // Go to reference
  GO_TO_REFERENCE = 'i18n-gettext.goToReference',
  // Update translation
  UPDATE_TRANSLATION = 'i18n-gettext.updateTranslation',
  // Machine translation
  TRANSLATE_BY_MACHINE = 'i18n-gettext.translateByMachine',
  // Select entry
  SELECT_ENTRY = 'i18n-gettext.selectEntry',
  // Send model configuration
  SEND_MODEL_CONFIG = 'i18n-gettext.sendModelConfig',
  // Log
  LOG = 'i18n-gettext.log',
  // AI translation
  AI_TRANSLATE = 'i18n-gettext.aiTranslate',
  // AI batch translation
  AI_BATCH_TRANSLATE = 'i18n-gettext.aiBatchTranslate',
  // AI translation result
  AI_TRANSLATE_RESULT = 'i18n-gettext.aiTranslateResult',
  // AI batch translation result
  AI_BATCH_TRANSLATE_RESULT = 'i18n-gettext.aiBatchTranslateResult',
}
