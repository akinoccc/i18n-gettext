import type { TranslationEntry } from 'types'
import { ref } from 'vue'
import { WebViewMessageType } from '../../constants'
import { useVscodeApi } from './useVscodeApi'

const translationEntry = ref<TranslationEntry>({
  id: 'this is a test',
  references: [],
  msgctxt: '',
  locales: {
    en: 'this is a test',
    zh: '',
  },
  hasUntranslated: false,
})

export function useTranslationEntry() {
  const vscodeApi = useVscodeApi()
  const sourceLanguage = ref('')

  // 保存翻译内容
  function saveTranslation(locale: string, value: string) {
    if (!translationEntry.value)
      return

    // 更新本地状态
    translationEntry.value.locales[locale] = value

    // 发送更新到VSCode扩展
    vscodeApi.postMessage({
      type: WebViewMessageType.UPDATE_TRANSLATION,
      data: {
        entry: JSON.stringify(translationEntry.value),
        locale,
        value,
      },
    })
  }

  // 跳转到引用位置
  function goToReference(reference: string) {
    vscodeApi.postMessage({
      type: WebViewMessageType.GO_TO_REFERENCE,
      data: {
        reference,
      },
    })
  }

  function updateTranslationEntry(langCode: string, value: string) {
    if (!translationEntry.value)
      return

    translationEntry.value.locales[langCode] = value
  }

  // 设置消息监听
  function setupMessageListeners() {
    // 监听翻译条目选择
    vscodeApi.on(WebViewMessageType.SELECT_ENTRY, (entry: TranslationEntry & { sourceLanguage: string }) => {
      translationEntry.value = entry
      sourceLanguage.value = entry.sourceLanguage
    })
  }

  return {
    translationEntry,
    sourceLanguage,
    saveTranslation,
    goToReference,
    setupMessageListeners,
    updateTranslationEntry,
  }
}
