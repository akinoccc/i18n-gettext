import {
  computed,
  defineExtension,
  useIsDarkTheme,
  useWorkspaceFolders,
  watchEffect,
} from 'reactive-vscode'
import * as vscode from 'vscode'
import { registerCustomCommands, registerViewCommands } from './commands'
import { EntryListProvider, FileTranslationProvider, ProgressProvider, ReferenceDefinitionProvider } from './providers'
import { logger } from './utils'

export const { activate, deactivate } = defineExtension(async (context) => {
  logger.info('i18n-gettext 插件已激活')

  // 获取工作区文件夹
  const workspaceFolders = useWorkspaceFolders()

  // 创建视图提供者实例
  const fileTranslationProvider = new FileTranslationProvider()
  const progressProvider = new ProgressProvider()
  const entryListProvider = new EntryListProvider()
  const definitionProvider = new ReferenceDefinitionProvider()

  // 注册视图
  try {
    // 注册当前文件翻译视图
    context.subscriptions.push(
      vscode.window.registerTreeDataProvider(
        'i18n-gettext.fileTranslation',
        fileTranslationProvider,
      ),
    )
    // 注册状态视图
    context.subscriptions.push(
      vscode.window.registerTreeDataProvider(
        'i18n-gettext.progress',
        progressProvider,
      ),
    )
    logger.info('成功注册翻译进度视图')

    // 注册翻译条目视图
    context.subscriptions.push(
      vscode.window.registerTreeDataProvider(
        'i18n-gettext.entries',
        entryListProvider,
      ),
    )
    logger.info('成功注册翻译条目视图')

    // 注册文件路径引用的定义提供者
    context.subscriptions.push(
      vscode.languages.registerDefinitionProvider(
        ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
        definitionProvider,
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

  // 计算工作区状态
  const workspaceState = computed(() => {
    const folders = workspaceFolders.value || []
    return {
      hasWorkspace: folders.length > 0,
      rootPath: folders[0]?.uri.fsPath || '',
    }
  })

  // 监听工作区变化
  watchEffect(() => {
    if (workspaceState.value.hasWorkspace) {
      logger.info(`工作区根目录: ${workspaceState.value.rootPath}`)
    }
  })

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
