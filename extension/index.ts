import {
  defineExtension,
  useIsDarkTheme,
  watchEffect,
} from 'reactive-vscode'
import * as vscode from 'vscode'
import { registerCommands } from './commands'
import { useAITranslator } from './composables'
import { GettextDecorationProvider, GettextDefinitionProvider, useEntryListTreeView, useFileTranslationTreeView, useProgressTreeView } from './providers'
import { logger } from './utils'

export const { activate, deactivate } = defineExtension(async (context) => {
  logger.info(vscode.l10n.t('i18n gettext extension activated'))

  // Get workspace folder
  // const workspaceFolders = useWorkspaceFolders()

  // Initialize translation view - using composables
  useEntryListTreeView()
  useFileTranslationTreeView()
  useProgressTreeView()

  // Create view provider instances
  // const referenceDefinitionProvider = new ReferenceDefinitionProvider()
  const gettextDefinitionProvider = new GettextDefinitionProvider(context)
  const gettextDecorationProvider = new GettextDecorationProvider()

  // Supported languages for i18n functions
  const supportedLanguages = [
    'typescript',
    'javascript',
    'typescriptreact',
    'javascriptreact',
    'vue',
    'html',
    'golang',
    'python',
    'php',
    'java',
    'csharp',
    'ruby',
    'rust',
    'swift',
    'kotlin',
    'scala',
    'groovy',
    'dart',
    'lua',
    'perl',
    'r',
    'julia',
    'elixir',
    'erlang',
    'haskell',
    'clojure',
    'lisp',
    'scheme',
    'fortran',
    'cobol',
    'ada',
    'pascal',
    'delphi',
    'objectivec',
    'objective-c',
    'smalltalk',
    'apl',
  ]

  // Register providers
  try {
    // Translation view is automatically registered through composables, only need to register definition providers here
    context.subscriptions.push(
      vscode.languages.registerDefinitionProvider(
        supportedLanguages,
        gettextDefinitionProvider,
      ),
    )
    logger.info(vscode.l10n.t('Successfully registered providers'))
  }
  catch (error) {
    logger.error(vscode.l10n.t('Error registering providers: {error}', { error }))
  }

  // Register all commands
  registerCommands(context)

  // Add decoration provider to disposables
  context.subscriptions.push(gettextDecorationProvider)

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
