import {
  defineExtension,
  useIsDarkTheme,
  watchEffect,
} from 'reactive-vscode'
import * as vscode from 'vscode'
import { registerCustomCommands, registerViewCommands } from './commands'
import { EntryListProvider, FileTranslationProvider, ProgressProvider, ReferenceDefinitionProvider } from './providers'
import { ScannerService } from './services'
import { useTranslationsState } from './state'
import { logger } from './utils/logger'

const { setTranslationTree }
  = useTranslationsState()

const { activate, deactivate } = defineExtension(async (context) => {
  logger.info('i18n-gettext 插件已激活')

  // 注册视图
  try {
    // 注册当前文件翻译视图
    context.subscriptions.push(
      vscode.window.registerTreeDataProvider(
        'i18n-gettext.fileTranslation',
        new FileTranslationProvider(),
      ),
    )
    // 注册状态视图
    context.subscriptions.push(
      vscode.window.registerTreeDataProvider(
        'i18n-gettext.progress',
        new ProgressProvider(),
      ),
    )
    logger.info('成功注册翻译进度视图')

    // 注册翻译条目视图
    context.subscriptions.push(
      vscode.window.registerTreeDataProvider(
        'i18n-gettext.entries',
        new EntryListProvider(),
      ),
    )
    logger.info('成功注册翻译条目视图')

    // 注册文件路径引用的定义提供者
    context.subscriptions.push(
      vscode.languages.registerDefinitionProvider(
        ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
        new ReferenceDefinitionProvider(),
      ),
    )
    logger.info('成功注册引用定义提供者')
  }
  catch (error) {
    logger.error('注册视图时发生错误:', error)
  }

  // 注册命令
  registerViewCommands(context)

  // 注册自定义命令
  registerCustomCommands(context)

  // 初始加载翻译数据
  // await refreshTranslations()

  // 监听主题变化
  const isDark = useIsDarkTheme()
  watchEffect(() => {
    logger.info(
      vscode.l10n.t(
        '主题已变更: {0}',
        isDark.value ? vscode.l10n.t('深色') : vscode.l10n.t('浅色'),
      ),
    )
  })
})

export { activate, deactivate }
