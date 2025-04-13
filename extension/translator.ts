import type { PoData, TranslationEntry } from './state/useTranslationsState'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as vscode from 'vscode'
import { getPoFilePath, localesConfig } from './configs'
import { logger } from './utils/logger'

export async function saveTranslation(entry: TranslationEntry, locale: string, value: string, domain?: string) {
  try {
    const gettextParser = await import('gettext-parser')
    // 获取根路径
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) {
      logger.warn('No workspace folder found')
      return
    }

    const rootPath = workspaceFolders[0].uri.fsPath
    const config = localesConfig.value
    // 使用通用方法获取PO文件相对路径
    const poFileRelativePath = getPoFilePath(locale, domain || config.defaultDomain)
    const poFilePath = path.join(rootPath, config.basePath, poFileRelativePath)

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
    let poData: PoData
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

    logger.info(`成功保存翻译: ${entry.id} [${locale}]`)
    return true
  }
  catch (error) {
    logger.error('保存翻译失败:', error)
    throw error
  }
}

export function translateByGoogle(text: string) {
  // 使用Google翻译
}

export function translateByDeepL(text: string) {
  // 使用DeepL翻译
}

export function translateByYoudao(text: string) {
  // 使用有道翻译
}

export function translateByBaidu(text: string) {
  // 使用百度翻译
}

export function translateByTencent(text: string) {
  // 使用腾讯翻译
}

export function translateByMicrosoft(text: string) {
  // 使用微软翻译
}

export function translateByYandex(text: string) {
  // 使用Yandex翻译
}
