import type { PoData, TranslationEntry, TranslationStatisticsObject, TranslationTree } from '../../../types'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { computed, ref, useWorkspaceFolders, watch } from 'reactive-vscode'
import * as vscode from 'vscode'
import { logger } from '../../utils/logger'
import { localesConfig } from '../config/useConfig'
import { useTranslationsState } from '../state'
/**
 * 翻译加载组合式函数
 * 提供处理翻译文件加载相关的响应式功能
 */
export function useTranslationLoader() {
  // 工作区文件夹
  const workspaceFolders = useWorkspaceFolders()

  // 翻译状态
  const { setTranslationTree, setLocaleStatistics } = useTranslationsState()

  // 缓存的翻译树
  const cachedTranslationTree = ref<TranslationTree | null>(null)

  // 正在加载的状态
  const isLoading = ref(false)

  // gettext-parser 模块
  let gettextParserModule: any = null

  // 根工作区路径
  const rootPath = computed(() => {
    const folders = workspaceFolders.value || []
    return folders.length > 0 ? folders[0].uri.fsPath : ''
  })

  /**
   * 获取 gettext-parser 模块
   */
  async function getGettextParser(): Promise<any> {
    if (!gettextParserModule) {
      gettextParserModule = await import('gettext-parser')
    }
    return gettextParserModule
  }

  /**
   * 读取 PO 文件
   */
  async function readPoFile(filePath: string): Promise<any> {
    try {
      const parser = await getGettextParser()
      const content = await fs.promises.readFile(filePath)
      return parser.po.parse(content)
    }
    catch (error) {
      logger.error(vscode.l10n.t('Failed to read PO file {filePath}:', { filePath }))
      return null
    }
  }

  /**
   * 从翻译对象中提取翻译条目
   */
  function extractTranslations(poData: PoData, locale: string): Record<
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
   * 刷新翻译数据
   */
  async function refreshTranslations(): Promise<TranslationTree> {
    // 如果已经在加载中，直接返回
    if (isLoading.value) {
      return cachedTranslationTree.value || { entries: [], locales: [] }
    }

    isLoading.value = true
    try {
      const translations = await loadTranslations()
      isLoading.value = false
      return translations
    }
    catch (error) {
      isLoading.value = false
      logger.error(vscode.l10n.t('Failed to refresh translations: {error}', { error }))
      return cachedTranslationTree.value || { entries: [], locales: [] }
    }
  }

  // 上次配置的Hash值，用于比较
  let lastConfigHash = ''
  let lastRootPath = ''

  /**
   * 加载所有翻译
   */
  async function loadTranslations(): Promise<TranslationTree> {
    logger.info(vscode.l10n.t('Loading PO files from locales directory'))

    if (!rootPath.value) {
      logger.warn(vscode.l10n.t('No workspace folder found'))
      return { entries: [], locales: [] }
    }

    // 准备当前配置状态的哈希值
    const currentConfigHash = JSON.stringify(localesConfig.value)
    const currentRootPath = rootPath.value

    // 如果配置和路径没有变化，且缓存存在，直接返回缓存
    if (
      currentConfigHash === lastConfigHash
      && currentRootPath === lastRootPath
      && cachedTranslationTree.value
    ) {
      return cachedTranslationTree.value
    }

    // 更新哈希值和路径记录
    lastConfigHash = currentConfigHash
    lastRootPath = currentRootPath

    const config = localesConfig.value
    const localesDirPath = path.join(rootPath.value, config.basePath)

    try {
      // 检查locales目录是否存在
      await fs.promises.access(localesDirPath)
    }
    catch (error) {
      logger.error(vscode.l10n.t('Locales directory not found: {localesDirPath}', { localesDirPath }))
      return { entries: [], locales: [] }
    }

    const { poFiles, locales } = await scanPoFiles(localesDirPath, config)

    // 处理扫描到的PO文件
    const result = await processPoFiles(poFiles, locales, config)

    // 只有结果真正变化时才更新缓存和状态
    const resultHash = JSON.stringify({
      entriesCount: result.entries.length,
      localesCount: result.locales.length,
    })
    const cacheHash = cachedTranslationTree.value
      ? JSON.stringify({
          entriesCount: cachedTranslationTree.value.entries.length,
          localesCount: cachedTranslationTree.value.locales.length,
        })
      : ''

    if (resultHash !== cacheHash) {
      // 更新缓存
      cachedTranslationTree.value = result

      // 更新翻译树状态
      setTranslationTree(result)

      logger.info(
        `Loaded ${result.entries.length} translation entries from ${result.locales.length} locales`,
      )
    }

    return result
  }

  /**
   * 扫描PO文件
   */
  async function scanPoFiles(localesDirPath: string, config: any) {
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
        // 处理嵌套和域结构
        const items = await fs.promises.readdir(localesDirPath, { withFileTypes: true })

        // 筛选出目录（每个语言一个目录）
        const localeDirs = items.filter(item => item.isDirectory())
        locales = localeDirs.map(dir => dir.name)

        // 对每个语言目录处理
        for (const locale of locales) {
          await processLocaleDir(locale, config, poFiles, rootPath.value)
        }
        break
      }
    }

    return { poFiles, locales }
  }

  /**
   * 处理语言目录
   */
  async function processLocaleDir(
    locale: string,
    config: any,
    poFiles: { locale: string, domain: string, path: string }[],
    rootPath: string,
  ) {
    // 此函数处理从单个语言目录中加载PO文件的逻辑
    const getLocaleDirPath = (locale: string): string => {
      let dirPath: string

      switch (config.type) {
        case 'flat':
          dirPath = config.basePath
          break
        case 'nested':
        case 'domain':
          dirPath = `${config.basePath}/${locale}`
          break
        case 'custom': {
          // 对于自定义模式，从pattern中提取目录部分
          const pattern = config.pattern
            .replace(/\$\{locale\}/g, locale)
            .replace(/\$\{domain\}/g, '*')
          dirPath = pattern.substring(0, pattern.lastIndexOf('/'))
          break
        }
        default:
          dirPath = `${config.basePath}/${locale}`
          break
      }

      return dirPath
    }

    let localeDir = getLocaleDirPath(locale)
    if (!localeDir.startsWith(rootPath)) {
      localeDir = path.join(rootPath, localeDir)
    }

    try {
      await fs.promises.access(localeDir)
    }
    catch (error) {
      logger.error(vscode.l10n.t('Locale directory not found: {localeDir}', { localeDir }))
      return
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
        logger.error(vscode.l10n.t('LC_MESSAGES directory not found: {lcMessagesDir}', { lcMessagesDir }))
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
        logger.error(vscode.l10n.t('Failed to read locale directory: {localeDir}', { localeDir }))
      }
    }
  }

  /**
   * 处理PO文件并构建翻译树
   */
  async function processPoFiles(
    poFiles: { locale: string, domain: string, path: string }[],
    locales: string[],
    config: any,
  ): Promise<TranslationTree> {
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
      const poData = await readPoFile(poFile.path)
      if (!poData)
        continue

      const translations = extractTranslations(poData, poFile.locale)
      const stats = localeStatistics.get(poFile.locale) || {
        translated: 0,
        untranslated: 0,
        total: 0,
      }

      // 将翻译添加到条目映射
      Object.keys(translations).forEach((msgid) => {
        const translation = translations[msgid]

        if (translation.msgstr || poFile.locale !== config.sourceLanguage) {
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

    // 更新统计数据状态
    setLocaleStatistics(Object.fromEntries(localeStatistics.entries()))

    // 转换为数组并排序
    const entries = Array.from(entriesMap.values()).sort((a, b) =>
      a.id.localeCompare(b.id),
    )

    return {
      entries,
      locales,
    }
  }

  /**
   * 清除翻译缓存
   */
  function clearTranslationCache(): void {
    cachedTranslationTree.value = null
    logger.info(vscode.l10n.t('Translation cache cleared'))
  }

  // 监听配置变化，自动刷新翻译
  watch(
    [localesConfig, rootPath],
    ([newConfig, newRootPath]) => {
      // 只有当配置或路径真正变化时才执行刷新
      logger.info(vscode.l10n.t('Configuration or workspace path changed, refreshing translations'))
      logger.info(vscode.l10n.t('localesConfig: {config}', { config: JSON.stringify(newConfig) }))
      logger.info(vscode.l10n.t('rootPath: {path}', { path: newRootPath }))
      if (newConfig && newRootPath) {
        refreshTranslations()
      }
    },
    { immediate: true },
  )

  return {
    loadTranslations,
    refreshTranslations,
    clearTranslationCache,
    isLoading,
    cachedTranslationTree,
  }
}
