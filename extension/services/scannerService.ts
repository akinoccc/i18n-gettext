import type {
  PoData,
  TranslationEntry,
  TranslationStatisticsObject,
  TranslationTree,
} from '../state'
import * as fs from 'node:fs'
import * as path from 'node:path'

import * as vscode from 'vscode'
import { useTranslationsState } from '../state'
import { logger } from '../utils/logger'
import { ConfigService, localesConfig } from './configService'

/**
 * 扫描服务类，提供PO文件扫描相关功能
 */
export class ScannerService {
  // 缓存的翻译树
  private static cachedTranslationTree: TranslationTree | null = null

  // 获取 gettext-parser 模块实例
  private static gettextParserModule: any = null

  /**
   * 获取gettext-parser模块
   * @returns gettext-parser模块实例
   */
  public static async getGettextParser(): Promise<any> {
    if (!this.gettextParserModule) {
      this.gettextParserModule = await import('gettext-parser')
    }
    return this.gettextParserModule
  }

  /**
   * 读取PO文件
   * @param filePath PO文件路径
   * @returns 解析后的PO数据或null
   */
  private static async readPoFile(filePath: string): Promise<any> {
    try {
      const parser = await this.getGettextParser()
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
   * @param poData PO数据
   * @param locale 语言代码
   * @returns 提取的翻译条目
   */
  private static extractTranslations(poData: PoData, locale: string): Record<
    string,
    {
      msgstr: string
      msgctxt: string
      references: string[]
    }
  > {
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
          references: translation.comments?.reference?.split('\n') || [],
        }
      })
    })

    return translations
  }

  /**
   * 加载所有翻译
   * @returns 加载的翻译树
   */
  public static async loadTranslations(): Promise<TranslationTree> {
    logger.info('Loading PO files from locales directory')

    // 如果有缓存且不超过5分钟，直接返回缓存
    const now = Date.now()
    if (
      this.cachedTranslationTree
      && now - this.cachedTranslationTree.timestamp < 5 * 60 * 1000
    ) {
      logger.info('Using cached translation tree')
      return this.cachedTranslationTree
    }

    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) {
      logger.warn('No workspace folder found')
      return { entries: [], locales: [], timestamp: now }
    }

    const rootPath = workspaceFolders[0].uri.fsPath
    const config = localesConfig.value
    logger.info('config', JSON.stringify(config))
    const localesDirPath = path.join(rootPath, config.basePath)

    try {
      // 检查locales目录是否存在
      await fs.promises.access(localesDirPath)
    }
    catch (error) {
      logger.error(`Locales directory not found: ${localesDirPath}`)
      return { entries: [], locales: [], timestamp: now }
    }

    let locales: string[] = []
    const poFiles: { locale: string, domain: string, path: string }[] = []

    // 根据不同的目录结构类型加载PO文件
    switch (config.type) {
      case 'flat': {
        // 扁平结构: locales/en.po, locales/zh.po
        const items = await fs.promises.readdir(localesDirPath, { withFileTypes: true })
        const poFilesInDir = items.filter(item => item.isFile() && path.extname(item.name).toLowerCase() === '.po')

        for (const file of poFilesInDir) {
          const locale = path.basename(file.name, '.po')
          locales.push(locale)
          poFiles.push({
            locale,
            domain: config.defaultDomain || 'app',
            path: path.join(localesDirPath, file.name),
          })
        }
        break
      }

      case 'nested':
      case 'domain':
      default: {
        // 嵌套结构: locales/en/app.po, locales/zh/app.po
        // 或域结构: locales/en/LC_MESSAGES/domain.po
        const items = await fs.promises.readdir(localesDirPath, { withFileTypes: true })

        // 筛选出目录（每个语言一个目录）
        const localeDirs = items.filter(item => item.isDirectory())
        locales = localeDirs.map(dir => dir.name)

        // 对于每个语言目录
        for (const locale of locales) {
          let localeDir = ConfigService.getLocaleDirPath(locale)
          if (!localeDir.startsWith(rootPath)) {
            localeDir = path.join(rootPath, localeDir)
          }

          try {
            await fs.promises.access(localeDir)
          }
          catch (error) {
            logger.error(`Locale directory not found: ${localeDir}`)
            continue
          }

          // 根据类型处理文件
          if (config.type === 'domain') {
            // 域结构: locale/en/LC_MESSAGES/domain.po
            const lcMessagesDir = path.join(localeDir, 'LC_MESSAGES')
            try {
              const messagesFiles = await fs.promises.readdir(lcMessagesDir, { withFileTypes: true })
              const domainPoFiles = messagesFiles.filter(
                file => file.isFile() && path.extname(file.name).toLowerCase() === '.po',
              )

              for (const file of domainPoFiles) {
                const domain = path.basename(file.name, '.po')
                poFiles.push({
                  locale,
                  domain,
                  path: path.join(lcMessagesDir, file.name),
                })
              }
            }
            catch (error) {
              logger.error(`LC_MESSAGES directory not found: ${lcMessagesDir}`)
              continue
            }
          }
          else {
            // 嵌套结构: locale/en/app.po
            try {
              const lcItems = await fs.promises.readdir(localeDir, { withFileTypes: true })
              const lcPoFiles = lcItems.filter(
                item => item.isFile() && path.extname(item.name).toLowerCase() === '.po',
              )

              for (const file of lcPoFiles) {
                const domain = path.basename(file.name, '.po')
                poFiles.push({
                  locale,
                  domain,
                  path: path.join(localeDir, file.name),
                })
              }
            }
            catch (error) {
              logger.error(`Failed to read locale directory: ${localeDir}`, error)
              continue
            }
          }
        }
        break
      }
    }

    // 用于收集所有翻译条目
    const entriesMap = new Map<string, TranslationEntry>()
    const localeStatistics = new Map<string, TranslationStatisticsObject>()

    // 初始化统计数据
    for (const locale of locales) {
      localeStatistics.set(locale, {
        translated: 0,
        untranslated: 0,
        total: 0,
      })
    }

    // 读取每个PO文件
    for (const poFile of poFiles) {
      const poData = await this.readPoFile(poFile.path)
      if (!poData)
        continue

      const translations = this.extractTranslations(poData, poFile.locale)
      const stats = localeStatistics.get(poFile.locale) || {
        translated: 0,
        untranslated: 0,
        total: 0,
      }

      // 将翻译添加到条目映射
      Object.keys(translations).forEach((msgid) => {
        const translation = translations[msgid]

        if (translation.msgstr) {
          stats.translated++
        }
        else {
          stats.untranslated++
        }
        stats.total++

        const entry = entriesMap.get(msgid)
        if (entry) {
          if (!translation.msgstr && poFile.locale !== config.sourceLanguage) {
            entry.hasUntranslated = true
          }
          // 已有此条目，添加此语言的翻译
          entry.locales[poFile.locale] = translation.msgstr
          entriesMap.set(msgid, entry)
        }
        else {
          // 创建新条目
          entriesMap.set(msgid, {
            id: msgid,
            msgctxt: translation.msgctxt,
            locales: { [poFile.locale]: translation.msgstr },
            references: translation.references,
            hasUntranslated: !translation.msgstr && poFile.locale !== config.sourceLanguage,
          })
        }
      })

      localeStatistics.set(poFile.locale, stats)
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

    // 更新缓存和状态
    this.cachedTranslationTree = result
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
   * @returns 是否保存成功
   */
  public static async saveTranslations(
    domain: string,
    locale: string,
    entries: TranslationEntry[],
  ): Promise<boolean> {
    // TODO: 实现保存逻辑
    return true
  }

  /**
   * 将翻译树中的条目保存为MO文件（二进制格式，用于生产环境）
   * @param domain 翻译域名
   * @param locale 语言代码
   * @param entries 要编译的翻译条目
   * @returns 是否编译成功
   */
  public static async compileToMO(
    domain: string,
    locale: string,
    entries: TranslationEntry[],
  ): Promise<boolean> {
    // TODO: 实现编译逻辑
    return true
  }

  /**
   * 清除翻译缓存
   */
  public static clearTranslationCache(): void {
    this.cachedTranslationTree = null
    logger.info('Translation cache cleared')
  }
}
