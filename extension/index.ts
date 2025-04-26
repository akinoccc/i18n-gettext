import {
  defineExtension,
  useIsDarkTheme,
  watchEffect,
} from 'reactive-vscode'
import * as vscode from 'vscode'
import { EditorType } from '../constants'
import { registerCommands } from './commands'
import { useAIConfig } from './composables'
import { GettextDecorationProvider, GettextDefinitionProvider, useEntryListTreeView, useFileTranslationTreeView, useProgressTreeView, useTranslationEditorProvider } from './providers'
import { logger } from './utils'

export const { activate, deactivate } = defineExtension(async (context) => {
  logger.info(vscode.l10n.t('i18n gettext extension activated'))

  const { initAIConfig } = useAIConfig()
  await initAIConfig()

  const { initialize } = useTranslationEditorProvider()
  initialize(context)

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

    // Register webview panel serializer to restore webview state after reload
    context.subscriptions.push(
      vscode.window.registerWebviewPanelSerializer(EditorType.TRANSLATION_EDITOR, {
        async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
          logger.info(vscode.l10n.t('Deserializing webview panel'), typeof state)
          // Restore the webview panel with its state
          useTranslationEditorProvider().deserialize(context, state, webviewPanel)
        },
      }),
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
})
