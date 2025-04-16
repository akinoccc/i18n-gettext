import type { TranslationTree } from '../../types'
import * as fs from 'node:fs'

import { createSingletonComposable } from 'reactive-vscode'
import * as vscode from 'vscode'
import { logger } from '../utils'
import { useTranslationLoader } from './useTranslationLoader'

/**
 * 扫描组合式函数，提供PO文件扫描相关功能
 */
export const useScanner = createSingletonComposable(() => {
  // 获取翻译加载器
  const translationLoader = useTranslationLoader()

  // 获取 gettext-parser 模块实例
  let gettextParserModule: any = null

  // 初始化加载进度
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Loading translations',
      cancellable: false,
    },
    () => {
      return translationLoader.loadTranslations()
    },
  )

  // 监听配置变化，自动刷新翻译
  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('translation.locales')) {
      refreshTranslations()
    }
  })

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
  async function refreshTranslations(): Promise<TranslationTree> {
    return translationLoader.refreshTranslations()
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

  /**
   * 加载所有翻译
   * @returns 加载的翻译树
   */
  async function loadTranslations(): Promise<TranslationTree> {
    return translationLoader.loadTranslations()
  }

  return {
    getGettextParser,
    refreshTranslations,
    readPoFile,
    loadTranslations,
  }
})
