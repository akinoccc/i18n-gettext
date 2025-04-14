import type { TranslationEntry } from '../state'
import * as fs from 'node:fs'
import * as path from 'node:path'

import { translate } from '@vitalets/google-translate-api'

import { createSingletonComposable } from 'reactive-vscode'
import * as vscode from 'vscode'
import { useTranslationsState } from '../state'
import { logger } from '../utils'
import { localesConfig, useConfig } from './useConfig'

/**
 * 语言代码映射类型
 */
type LanguageMappings = Record<string, Record<string, string>>

/**
 * 翻译组合式函数
 */
export const useTranslator = createSingletonComposable(() => {
  const config = useConfig()
  const { updateTranslation } = useTranslationsState()

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
   * 保存翻译到PO文件
   * @param entry 翻译条目
   * @param locale 语言代码
   * @param value 翻译值
   * @param domain 可选的域名
   * @returns 是否保存成功
   */
  async function saveTranslation(
    entry: TranslationEntry,
    locale: string,
    value: string,
    domain?: string,
  ): Promise<boolean> {
    try {
      const gettextParser = await import('gettext-parser')
      // 获取根路径
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (!workspaceFolders || workspaceFolders.length === 0) {
        logger.warn('No workspace folder found')
        return false
      }

      const rootPath = workspaceFolders[0].uri.fsPath
      const configValue = localesConfig.value
      // 使用配置服务获取PO文件相对路径
      const poFileRelativePath = config.getPoFilePath(locale, domain || configValue.defaultDomain)
      const poFilePath = path.join(rootPath, configValue.basePath, poFileRelativePath)

      // 确保目录存在
      const poFileDir = path.dirname(poFilePath)
      try {
        await fs.promises.mkdir(poFileDir, { recursive: true })
      }
      catch (error) {
        logger.error(`创建目录失败: ${poFileDir}`, error)
        throw error
      }

      // 读取现有的po文件，如果不存在则创建新的
      let poData: any
      try {
        const poContent = await fs.promises.readFile(poFilePath)
        poData = gettextParser.po.parse(poContent)
      }
      catch (error) {
        // 如果文件不存在，则创建新的PO数据结构
        logger.info(`创建新的PO文件: ${poFilePath}`)
        poData = {
          charset: 'utf-8',
          headers: {
            'Project-Id-Version': 'PACKAGE VERSION',
            'Report-Msgid-Bugs-To': '',
            'POT-Creation-Date': new Date().toISOString(),
            'PO-Revision-Date': new Date().toISOString(),
            'Last-Translator': 'FULL NAME <EMAIL@ADDRESS>',
            'Language-Team': locale,
            'Language': locale,
            'MIME-Version': '1.0',
            'Content-Type': 'text/plain; charset=UTF-8',
            'Content-Transfer-Encoding': '8bit',
            'Plural-Forms': 'nplurals=2; plural=(n != 1);',
          },
          translations: {},
        }
      }

      // 更新翻译
      const context = entry.msgctxt || ''
      if (!poData.translations[context]) {
        poData.translations[context] = {}
      }

      // 更新或创建翻译条目
      poData.translations[context][entry.id] = {
        msgid: entry.id,
        msgstr: [value],
        msgctxt: entry.msgctxt,
        comments: {
          reference: Array.isArray(entry.references) ? entry.references.join('\n') : entry.references,
        },
      }

      // 将更新后的数据写回po文件
      const buffer = gettextParser.po.compile(poData)
      await fs.promises.writeFile(poFilePath, buffer)

      // 刷新翻译数据
      updateTranslation(entry)

      logger.info(`成功保存翻译: ${entry.id} [${locale}]`)
      return true
    }
    catch (error) {
      logger.error('保存翻译失败:', error)
      throw error
    }
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
      logger.error('Google翻译失败:', error)
      throw error
    }
  }

  return {
    saveTranslation,
    getTargetLanguage,
    translateByGoogle,
  }
})
