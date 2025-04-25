/**
 * WebView message type enumeration
 */
export enum WebViewMessageType {
  // Initialize webview
  INIT_WEBVIEW = 'i18n-gettext.initWebview',
  // Webview ready
  WEBVIEW_READY = 'i18n-gettext.webviewReady',
  // Webview type
  // WEBVIEW_TYPE = 'i18n-gettext.webviewType',
  // Go to reference
  GO_TO_REFERENCE = 'i18n-gettext.goToReference',
  // Update translation
  UPDATE_TRANSLATION = 'i18n-gettext.updateTranslation',
  // Machine translation
  TRANSLATE_BY_MACHINE = 'i18n-gettext.translateByMachine',
  // Machine translation result
  TRANSLATE_BY_MACHINE_RESULT = 'i18n-gettext.translateByMachineResult',
  // Update selected entry
  UPDATE_SELECTED_ENTRY = 'i18n-gettext.updateSelectedEntry',
  // Send model configuration
  UPDATE_AI_CONFIG = 'i18n-gettext.updateAIConfig',
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
  // Next untranslated entry
  NEXT_UNTRANSLATED_ENTRY = 'i18n-gettext.nextUntranslatedEntry',
  // Untranslated entries
  // UNTRANSLATED_ENTRIES = 'i18n-gettext.untranslatedEntries',
}
