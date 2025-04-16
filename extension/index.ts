import {
  defineExtension,
  useIsDarkTheme,
  watchEffect,
} from 'reactive-vscode'
import * as vscode from 'vscode'
import { registerCommands } from './commands'
import { useAITranslator } from './composables'
import { ReferenceDefinitionProvider, useEntryListTreeView, useFileTranslationTreeView, useProgressTreeView } from './providers'
import { logger } from './utils'

export const { activate, deactivate } = defineExtension(async (context) => {
  logger.info(vscode.l10n.t('i18n gettext extension activated'))

  // Get workspace folder
  // const workspaceFolders = useWorkspaceFolders()

  // Initialize translation view - using composables
  useEntryListTreeView()
  useFileTranslationTreeView()
  useProgressTreeView()

  // Create view provider instance
  const definitionProvider = new ReferenceDefinitionProvider()

  // Register view
  try {
    // Translation view is automatically registered through composables, only need to register reference definition provider here
    context.subscriptions.push(
      vscode.languages.registerDefinitionProvider(
        ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
        definitionProvider,
      ),
    )
    logger.info(vscode.l10n.t('Successfully registered reference definition provider'))
  }
  catch (error) {
    logger.error(vscode.l10n.t('Error registering view: {error}', { error }))
  }

  // Register all commands
  registerCommands(context)

  // Calculate workspace state
  // const workspaceState = computed(() => {
  //   const folders = workspaceFolders.value || []
  //   return {
  //     hasWorkspace: folders.length > 0,
  //     rootPath: folders[0]?.uri.fsPath || '',
  //   }
  // })

  // Listen for workspace changes
  // const workspaceState = computed(() => {
  //   const folders = workspaceFolders.value || []
  //   return {
  //     hasWorkspace: folders.length > 0,
  //     rootPath: folders[0]?.uri.fsPath || '',
  //   }
  // })

  // Listen for theme changes
  const isDark = useIsDarkTheme()
  watchEffect(() => {
    logger.info(
      vscode.l10n.t(
        'Theme changed: {mode}',
        { mode: isDark.value ? vscode.l10n.t('dark') : vscode.l10n.t('light') },
      ),
    )
  })

  useAITranslator().getAvailableModels()
})
