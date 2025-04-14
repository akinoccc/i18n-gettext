import {
  computed,
  defineExtension,
  useIsDarkTheme,
  useWorkspaceFolders,
  watchEffect,
} from 'reactive-vscode'
import * as vscode from 'vscode'
import { registerCommands } from './commands'
import { ReferenceDefinitionProvider, useEntryListTreeView, useFileTranslationTreeView, useProgressTreeView } from './providers'
import { logger } from './utils'

export const { activate, deactivate } = defineExtension(async (context) => {
  logger.info('i18n-gettext extension activated')

  // 获取工作区文件夹
  // const workspaceFolders = useWorkspaceFolders()

  // 初始化翻译视图 - 使用组合式函数
  useEntryListTreeView()
  useFileTranslationTreeView()
  useProgressTreeView()

  // 创建视图提供者实例
  const definitionProvider = new ReferenceDefinitionProvider()

  // 注册视图
  try {
    // 翻译视图通过组合式函数自动注册，这里只需要注册引用定义提供者
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

  // 注册所有命令
  registerCommands(context)

  // // 计算工作区状态
  // const workspaceState = computed(() => {
  //   const folders = workspaceFolders.value || []
  //   return {
  //     hasWorkspace: folders.length > 0,
  //     rootPath: folders[0]?.uri.fsPath || '',
  //   }
  // })

  // // 监听工作区变化
  // watchEffect(() => {
  //   if (workspaceState.value.hasWorkspace) {
  //     logger.info(`工作区根目录: ${workspaceState.value.rootPath}`)
  //   }
  // })

  // 监听主题变化
  const isDark = useIsDarkTheme()
  watchEffect(() => {
    logger.info(
      vscode.l10n.t(
        'Theme changed: {mode}',
        { mode: isDark.value ? vscode.l10n.t('dark') : vscode.l10n.t('light') },
      ),
    )
  })
})
