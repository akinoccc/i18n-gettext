import { ref } from 'vue'
import type { TranslationEntry } from '../types'
import { useVscodeApi } from './useVscodeApi'

export function useTranslationEntry() {
  const vscodeApi = useVscodeApi()
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
  const sourceLanguage = ref('')

  // 保存翻译内容
  function saveTranslation(locale: string, value: string) {
    if (!translationEntry.value)
      return

    // 更新本地状态
    translationEntry.value.locales[locale] = value

    // 发送更新到VSCode扩展
    vscodeApi.postMessage({
      type: 'i18n-gettext.updateTranslation',
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
      type: 'i18n-gettext.goToReference',
      data: {
        reference,
      },
    })
  }

  // 设置消息监听
  function setupMessageListeners() {
    // 监听翻译条目选择
    vscodeApi.on('i18n-gettext.selectEntry', (entry: TranslationEntry & { sourceLanguage: string }) => {
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
  }
} 