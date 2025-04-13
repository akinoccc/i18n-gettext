import type {
  TranslationTree,
} from '../state'
import * as fs from 'node:fs'

import * as vscode from 'vscode'
import { useTranslationLoader } from '../composables'
import { logger } from '../utils'

// 初始化翻译加载器
const translationLoader = useTranslationLoader()

/**
 * 扫描服务类，提供PO文件扫描相关功能
 * 此类是对 useTranslationLoader 组合式函数的简单封装，
 * 提供与现有代码兼容的静态方法接口
 */
export class ScannerService {
  // 获取 gettext-parser 模块实例
  private static gettextParserModule: any = null

  // 正在加载的状态
  private static isLoading = vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Loading translations',
      cancellable: false,
    },
    () => {
      return translationLoader.loadTranslations()
    },
  )

  // 初始化
  static {
    // 监听配置变化，自动刷新翻译
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('translation.locales')) {
        this.refreshTranslations()
      }
    })
  }

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
   * 刷新翻译数据
   */
  public static async refreshTranslations(): Promise<TranslationTree> {
    return translationLoader.refreshTranslations()
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
   * 加载所有翻译
   * @returns 加载的翻译树
   */
  public static async loadTranslations(): Promise<TranslationTree> {
    return translationLoader.loadTranslations()
  }
}
