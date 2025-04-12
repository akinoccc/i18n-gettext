import type { PoData, TranslationEntry } from './state/useTranslationsState'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as vscode from 'vscode'
import { localesPath } from './configs'
import { logger } from './utils'

export async function saveTranslation(entry: TranslationEntry, locale: string, value: string) {
  try {
    const gettextParser = await import('gettext-parser')
    // 获取po文件路径
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) {
      logger.warn('No workspace folder found')
      return
    }

    const rootPath = workspaceFolders[0].uri.fsPath
    const localesDirPath = path.join(rootPath, localesPath.value)
    const poFilePath = path.join(localesDirPath, locale, `app.po`)
    // 读取现有的po文件
    let poData: PoData
    try {
      const poContent = fs.readFileSync(poFilePath)
      poData = gettextParser.po.parse(poContent)
    }
    catch (error) {
      logger.error(`读取po文件失败: ${poFilePath}`, error)
      throw error
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
        reference: entry.references.join(' '),
      },
    }

    // 将更新后的数据写回po文件
    const buffer = gettextParser.po.compile(poData)
    fs.writeFileSync(poFilePath, buffer)

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
