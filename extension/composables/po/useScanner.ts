import type { PoData, TranslationEntry, TranslationStatisticsObject, TranslationTree } from '../../../typings'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { computed, createSingletonComposable, ref, useWorkspaceFolders, watch } from 'reactive-vscode'
import * as vscode from 'vscode'
import { logger } from '../../utils'
import { useVscodeConfig } from '../config'
import { useTranslationsState } from '../state'
import { usePath } from './usePath'

/**
 * 扫描组合式函数，提供PO文件扫描相关功能
 */
export const useScanner = createSingletonComposable(() => {
  const { localesConfig } = useVscodeConfig()

  // 获取 gettext-parser 模块实例
  let gettextParserModule: any = null

  // 工作区文件夹
  const workspaceFolders = useWorkspaceFolders()

  // 翻译状态
  const { setTranslationTree, setLocaleStatistics } = useTranslationsState()

  // 缓存的翻译树
  const cachedTranslationTree = ref<TranslationTree | null>(null)

  // 正在加载的状态
  const isLoading = ref(false)

  // 使用 usePathUtils composable
  const { getLocaleDirPath } = usePath()

  // 根工作区路径
  const rootPath = computed(() => {
    const folders = workspaceFolders.value || []
    return folders.length > 0 ? folders[0].uri.fsPath : ''
  })

  function buildItemKey(msgid: string, msgctxt: string): string {
    return `${msgid}:${msgctxt}`
  }

  /**
   * 获取gettext-parser模块
   * @returns gettext-parser模块实例
   */
  async function getGettextParser(): Promise<any> {
    if (!gettextParserModule) {
      gettextParserModule = await import('gettext-parser')
    }
    return gettextParserModule
  }

  /**
   * 刷新翻译数据
   */
  async function loadAndRefreshTranslations(): Promise<TranslationTree> {
    if (isLoading.value) {
      return cachedTranslationTree.value || { entries: [], locales: [] }
    }

    isLoading.value = true

    return new Promise(async (resolve) => {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: vscode.l10n.t('Loading translations...'),
        cancellable: false,
      }, async (progress) => {
        progress.report({ increment: 0 })
        try {
          const config = localesConfig.value
          const localesDirPath = path.join(rootPath.value, config.root, config.basePath)

          try {
            await fs.promises.access(localesDirPath)
          }
          catch (error) {
            logger.error(vscode.l10n.t('Locales directory not found: {localesDirPath}', { localesDirPath }))
            resolve({ entries: [], locales: [] })
          }

          progress.report({ increment: 50, message: vscode.l10n.t('Loading translation files...') })
          const { poFiles, locales } = await scanPoFiles(localesDirPath, config)
          const result = await processPoFiles(poFiles, locales, config)

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
            cachedTranslationTree.value = result
            setTranslationTree(result)
            logger.info(
              `Loaded ${result.entries.length} translation entries from ${result.locales.length} locales`,
            )
          }
          progress.report({ increment: 100, message: vscode.l10n.t('Translations refreshed successfully') })
          isLoading.value = false
          resolve(result)
        }
        catch (error) {
          isLoading.value = false
          logger.error(vscode.l10n.t('Failed to load translations: {error}', { error }))
          resolve(cachedTranslationTree.value || { entries: [], locales: [] })
        }
      })
    })
  }

  /**
   * 读取PO文件
   * @param filePath PO文件路径
   * @returns 解析后的PO数据或null
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

  function extractTranslations(poData: PoData): Record<string, { msgid: string, msgstr: string, msgctxt: string, references: string[] }> {
    const translations: Record<string, { msgid: string, msgstr: string, msgctxt: string, references: string[] }> = {}
    const contexts = poData.translations || {}
    Object.keys(contexts).forEach((context) => {
      const messages = contexts[context]
      Object.keys(messages).forEach((msgid) => {
        if (msgid === '')
          return
        const translation = messages[msgid]
        translations[buildItemKey(msgid, translation.msgctxt)] = {
          msgid,
          msgstr: translation.msgstr[0] || '',
          msgctxt: translation.msgctxt || '',
          references: translation.comments?.reference?.split(/\s+/) || [],
        }
      })
    })
    return translations
  }

  async function scanPoFiles(localesDirPath: string, config: any) {
    let locales: string[] = []
    const poFiles: { locale: string, domain: string, path: string }[] = []
    switch (config.type) {
      case 'flat': {
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
        const items = await fs.promises.readdir(localesDirPath, { withFileTypes: true })
        const localeDirs = items.filter(item => item.isDirectory())
        locales = localeDirs.map(dir => dir.name)
        for (const locale of locales) {
          await processLocaleDir(locale, config, poFiles, rootPath.value)
        }
        break
      }
    }
    return { poFiles, locales }
  }

  async function processLocaleDir(locale: string, config: any, poFiles: { locale: string, domain: string, path: string }[], rootPath: string) {
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

    if (config.type === 'domain') {
      const lcMessagesDir = path.join(localeDir, 'LC_MESSAGES')
      try {
        const messagesFiles = await fs.promises.readdir(lcMessagesDir, { withFileTypes: true })
        const domainPoFiles = messagesFiles.filter(file => file.isFile() && path.extname(file.name).toLowerCase() === '.po')
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
      try {
        const lcItems = await fs.promises.readdir(localeDir, { withFileTypes: true })
        const lcPoFiles = lcItems.filter(item => item.isFile() && path.extname(item.name).toLowerCase() === '.po')
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

  async function processPoFiles(poFiles: { locale: string, domain: string, path: string }[], locales: string[], config: any): Promise<TranslationTree> {
    const entriesMap = new Map<string, TranslationEntry>()
    const localeStatistics = new Map<string, TranslationStatisticsObject>()
    for (const locale of locales) {
      localeStatistics.set(locale, {
        translated: 0,
        untranslated: 0,
        total: 0,
      })
    }
    for (const poFile of poFiles) {
      const poData = await readPoFile(poFile.path)
      if (!poData)
        continue
      const translations = extractTranslations(poData)
      const stats = localeStatistics.get(poFile.locale) || {
        translated: 0,
        untranslated: 0,
        total: 0,
      }
      Object.keys(translations).forEach((itemKey) => {
        const translation = translations[itemKey]
        if (translation.msgstr || poFile.locale === config.sourceLanguage) {
          stats.translated++
        }
        else {
          stats.untranslated++
        }
        stats.total++
        const entry = entriesMap.get(itemKey)
        if (entry) {
          if (!translation.msgstr && poFile.locale !== config.sourceLanguage) {
            entry.hasUntranslated = true
          }
          entry.locales[poFile.locale] = translation.msgstr
          entriesMap.set(itemKey, entry)
        }
        else {
          entriesMap.set(itemKey, {
            id: translation.msgid,
            msgctxt: translation.msgctxt,
            locales: { [poFile.locale]: translation.msgstr },
            references: translation.references,
            hasUntranslated: !translation.msgstr && poFile.locale !== config.sourceLanguage,
          })
        }
      })
      localeStatistics.set(poFile.locale, stats)
    }
    setLocaleStatistics(Object.fromEntries(localeStatistics.entries()))
    const entries = Array.from(entriesMap.values()).sort((a, b) => a.id.localeCompare(b.id))
    return {
      entries,
      locales,
    }
  }

  function clearTranslationCache(): void {
    cachedTranslationTree.value = null
    logger.info(vscode.l10n.t('Translation cache cleared'))
  }

  watch(
    [localesConfig, rootPath],
    ([newConfig, newRootPath]) => {
      logger.info(vscode.l10n.t('Configuration or workspace path changed, refreshing translations'))
      logger.info(vscode.l10n.t('localesConfig: {config}', { config: JSON.stringify(newConfig) }))
      logger.info(vscode.l10n.t('rootPath: {path}', { path: newRootPath }))
      if (newConfig && newRootPath) {
        loadAndRefreshTranslations()
      }
    },
    { immediate: true },
  )

  return {
    getGettextParser,
    loadAndRefreshTranslations,
    readPoFile,
    extractTranslations,
    scanPoFiles,
    processLocaleDir,
    processPoFiles,
    clearTranslationCache,
  }
})
