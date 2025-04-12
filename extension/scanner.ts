import type {
  PoData,
  TranslationEntry,
  TranslationStatisticsObject,
  TranslationTree,
} from './state'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as vscode from 'vscode'
import { localesPath } from './configs'
import {
  useTranslationsState,
} from './state'
import { logger } from './utils'

// 缓存的翻译树
let cachedTranslationTree: TranslationTree | null = null

// 获取 gettext-parser
let gettextParserModule: any = null
export async function getGettextParser() {
  if (!gettextParserModule) {
    gettextParserModule = await import('gettext-parser')
  }
  return gettextParserModule
}

/**
 * 读取PO文件
 */
async function readPoFile(filePath: string): Promise<any> {
  try {
    const parser = await getGettextParser()
    const content = await fs.promises.readFile(filePath)
    return parser.po.parse(content)
  }
  catch (error) {
    logger.error(`Failed to read PO file ${filePath}:`, error)
    return null
  }
}

/**
 * 从翻译对象中提取翻译条目
 */
function extractTranslations(poData: PoData, locale: string) {
  const translations: Record<
    string,
    {
      msgstr: string
      msgctxt: string
      references: string[]
    }
  > = {}

  // gettext-parser解析的数据结构是按上下文组织的，通常默认上下文是空字符串
  const contexts = poData.translations || {}

  // 遍历所有上下文
  Object.keys(contexts).forEach((context) => {
    const messages = contexts[context]

    // 跳过PO文件的头部信息
    Object.keys(messages).forEach((msgid) => {
      if (msgid === '')
        return

      const translation = messages[msgid]
      // 使用第一个翻译（单数形式）
      translations[msgid] = {
        msgstr: translation.msgstr[0] || '',
        msgctxt: translation.msgctxt || '',
        references: translation.comments.reference.split('\n'),
      }
    })
  })

  return translations
}

/**
 * 扫描并读取所有PO文件
 */
export async function loadTranslations(): Promise<TranslationTree> {
  logger.info('Loading PO files from locales directory')

  // 如果有缓存且不超过5分钟，直接返回缓存
  const now = Date.now()
  if (
    cachedTranslationTree
    && now - cachedTranslationTree.timestamp < 5 * 60 * 1000
  ) {
    logger.info('Using cached translation tree')
    return cachedTranslationTree
  }

  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders || workspaceFolders.length === 0) {
    logger.warn('No workspace folder found')
    return { entries: [], locales: [], timestamp: now }
  }

  const rootPath = workspaceFolders[0].uri.fsPath
  const localesDirPath = path.join(rootPath, localesPath.value)

  try {
    // 检查locales目录是否存在
    await fs.promises.access(localesDirPath)
  }
  catch (error) {
    logger.error(`Locales directory not found: ${localesDirPath}`)
    return { entries: [], locales: [], timestamp: now }
  }

  // 读取locales目录
  const items = await fs.promises.readdir(localesDirPath, {
    withFileTypes: true,
  })

  // 筛选出目录（每个语言一个目录）
  const localeDirs = items.filter(item => item.isDirectory())
  const locales: string[] = localeDirs.map(dir => dir.name)

  // 用于收集所有翻译条目
  const entriesMap = new Map<string, TranslationEntry>()

  const localeStatistics = new Map<string, TranslationStatisticsObject>()

  // 遍历每个语言目录
  for (const locale of locales) {
    const localeDir = path.join(localesDirPath, locale)
    const lcItems = await fs.promises.readdir(localeDir, {
      withFileTypes: true,
    })

    localeStatistics.set(locale, {
      translated: 0,
      untranslated: 0,
      total: 0,
    })

    // 筛选出.po文件
    const poFiles = lcItems
      .filter(
        item =>
          item.isFile() && path.extname(item.name).toLowerCase() === '.po',
      )
      .map(file => path.join(localeDir, file.name))

    // 读取每个.po文件
    for (const poFile of poFiles) {
      const poData = await readPoFile(poFile)

      if (!poData)
        continue

      const translations = extractTranslations(poData, locale)

      let translated = 0
      let untranslated = 0

      // 将翻译添加到条目映射
      Object.keys(translations).forEach((msgid) => {
        const translation = translations[msgid]

        const entry = entriesMap.get(msgid)

        if (translation.msgstr) {
          translated++
        }
        else {
          untranslated++
        }

        if (entry) {
          if (!translation.msgstr) {
            entry.hasUntranslated = true
          }
          // 已有此条目，添加此语言的翻译
          entry.locales[locale] = translation.msgstr
          entriesMap.set(msgid, entry)
        }
        else {
          // 创建新条目
          entriesMap.set(msgid, {
            id: msgid,
            msgctxt: translation.msgctxt,
            locales: { [locale]: translation.msgstr },
            references: translation.references,
            hasUntranslated: false,
          })
        }
      })

      localeStatistics.set(locale, {
        translated,
        untranslated,
        total: translated + untranslated,
      })
    }
  }

  const { setTranslationTree, setLocaleStatistics } = useTranslationsState()
  setLocaleStatistics(Object.fromEntries(localeStatistics.entries()))

  // 转换为数组并排序
  const entries = Array.from(entriesMap.values()).sort((a, b) =>
    a.id.localeCompare(b.id),
  )

  const result: TranslationTree = {
    entries,
    locales,
    timestamp: now,
  }
  setTranslationTree(result)

  logger.info(
    `Loaded ${entries.length} translation entries from ${locales.length} locales`,
  )
  return result
}

/**
 * 将翻译树中的条目保存为PO文件
 * @param domain 翻译域名（通常是项目名）
 * @param locale 语言代码
 * @param entries 要保存的翻译条目
 */
export async function saveTranslations(
  domain: string,
  locale: string,
  entries: TranslationEntry[],
): Promise<boolean> {
  return true
}

/**
 * 将翻译树中的条目保存为MO文件（二进制格式，用于生产环境）
 */
export async function compileToMO(
  domain: string,
  locale: string,
  entries: TranslationEntry[],
): Promise<boolean> {
  return true
}

/**
 * 清除翻译缓存
 */
export function clearTranslationCache(): void {
  cachedTranslationTree = null
  logger.info('Translation cache cleared')
}
