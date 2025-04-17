import { translate } from '@vitalets/google-translate-api'

import { createSingletonComposable } from 'reactive-vscode'
import * as vscode from 'vscode'
import { WebViewMessageType } from '../../../constants'
import { logger } from '../../utils'
import { usePoEditor } from '../po/usePoEditor'
import { useTranslationsState } from '../state'

/**
 * 语言代码映射类型
 */
type LanguageMappings = Record<string, Record<string, string>>

/**
 * 谷歌翻译请求数据
 */
export interface GoogleTranslateRequestData {
  originalCode: string
  targetCode: string
  entryId: string
}

/**
 * 翻译组合式函数
 */
export const useTranslator = createSingletonComposable(() => {
  const { getEntryById, setSelectedEntry } = useTranslationsState()

  /**
   * 翻译服务的语言代码映射
   * 不同翻译服务对语言代码的要求不同，需要进行映射
   */
  const LANGUAGE_MAPPINGS: LanguageMappings = {
    google: {
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
      'en': 'en',
      'ja': 'ja',
      'ko': 'ko',
    },
    deepl: {
      'zh-CN': 'ZH',
      'zh-TW': 'ZH',
      'en': 'EN',
      'ja': 'JA',
      'ko': 'KO',
    },
    youdao: {
      'zh-CN': 'zh-CHS',
      'zh-TW': 'zh-CHT',
      'en': 'en',
      'ja': 'ja',
      'ko': 'ko',
    },
    baidu: {
      'zh-CN': 'zh',
      'zh-TW': 'cht',
      'en': 'en',
      'ja': 'jp',
      'ko': 'kor',
    },
    tencent: {
      'zh-CN': 'zh',
      'zh-TW': 'zh-TW',
      'en': 'en',
      'ja': 'ja',
      'ko': 'ko',
    },
    microsoft: {
      'zh-CN': 'zh-Hans',
      'zh-TW': 'zh-Hant',
      'en': 'en',
      'ja': 'ja',
      'ko': 'ko',
    },
    yandex: {
      'zh-CN': 'zh',
      'zh-TW': 'zh',
      'en': 'en',
      'ja': 'ja',
      'ko': 'ko',
    },
  }

  /**
   * 获取目标语言代码
   * @param locale 源语言代码
   * @param service 翻译服务名称
   * @returns 目标语言代码
   */
  function getTargetLanguage(locale: string, service: string): string {
    const mappings = LANGUAGE_MAPPINGS[service]
    if (!mappings) {
      return locale
    }

    // 获取简化的语言代码
    const simplifiedLocale = locale.split('-')[0]
    return mappings[locale] || mappings[simplifiedLocale] || locale
  }

  /**
   * 使用Google翻译
   * @param text 要翻译的文本
   * @param targetLocale 目标语言
   * @returns 翻译结果
   */
  async function translateByGoogle(text: string, targetLocale: string): Promise<string> {
    try {
      const targetLang = getTargetLanguage(targetLocale, 'google')
      const result = await translate(text, { to: targetLang })
      return result.text || text
    }
    catch (error) {
      logger.error(vscode.l10n.t('Google translation failed: {error}', { error }))
      throw error
    }
  }

  /**
   * 处理谷歌翻译请求
   * @param data 翻译数据
   * @param webview Webview实例
   * @returns 翻译结果
   */
  async function handleGoogleTranslate(data: GoogleTranslateRequestData, webview: vscode.Webview): Promise<string> {
    try {
      const result = await translateByGoogle(data.entryId, data.targetCode)

      logger.info(vscode.l10n.t('Google translation completed'))

      // 保存翻译结果
      await usePoEditor().save(data.entryId, data.originalCode, result)

      // 发送结果给webview
      await webview.postMessage({
        type: WebViewMessageType.TRANSLATE_BY_MACHINE_RESULT,
        data: {
          result,
          entryId: data.entryId,
          targetLanguage: data.originalCode,
        },
      })

      // 更新选中的条目
      const updatedEntry = getEntryById(data.entryId)
      if (updatedEntry) {
        setSelectedEntry(updatedEntry)
      }

      return result
    }
    catch (error: any) {
      logger.error(vscode.l10n.t('Google translation failed: {error}', { error: error?.message || 'Unknown error' }))

      // 发送错误信息给webview
      webview.postMessage({
        type: WebViewMessageType.TRANSLATE_BY_MACHINE_RESULT,
        data: {
          result: '',
          targetLanguage: data.originalCode,
          error: error?.message || 'Unknown error',
        },
      })

      throw error
    }
  }

  return {
    getTargetLanguage,
    translateByGoogle,
    handleGoogleTranslate,
  }
})
