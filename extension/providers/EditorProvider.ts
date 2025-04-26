import { createSingletonComposable, ref, shallowRef, useWebviewPanel } from 'reactive-vscode'
import * as vscode from 'vscode'
import { EditorType } from '../../constants'
import { useTranslationsState, useWebview, useWebviewHandler } from '../composables'
import { logger } from '../utils/logger'

export const useTranslationEditorProvider = createSingletonComposable(() => {
  const { setWebview } = useWebview()
  const webViewPanel = shallowRef<vscode.WebviewPanel>()
  const webviewHandler = useWebviewHandler()
  const _disposables: vscode.Disposable[] = []
  const context = ref<vscode.ExtensionContext>()

  /**
   * 设置 webview 面板的图标
   * @param panel WebviewPanel 实例
   * @param context 扩展上下文
   */
  const setWebviewIcon = () => {
    webViewPanel.value!.iconPath = {
      light: vscode.Uri.joinPath(context.value!.extensionUri, 'resources', 'i18n-gettext-light.svg'),
      dark: vscode.Uri.joinPath(context.value!.extensionUri, 'resources', 'i18n-gettext-dark.svg'),
    }
  }

  const initialize = (ctx: vscode.ExtensionContext) => {
    context.value = ctx
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  const dispose = () => {
    // Dispose of the current webview panel
    webViewPanel.value?.dispose()
    webViewPanel.value = undefined

    // Dispose of all disposables (i.e. commands) for the current webview panel
    while (_disposables.length) {
      const disposable = _disposables.pop()
      if (disposable) {
        disposable.dispose()
      }
    }
  }

  /**
   * Create or show the translation editor panel
   * @param viewColumn View column to show the panel in
   */
  const render = (viewColumn: vscode.ViewColumn = vscode.ViewColumn.Beside) => {
    if (!webViewPanel.value) {
      webViewPanel.value = useWebviewPanel(
        EditorType.TRANSLATION_EDITOR,
        'i18n Gettext 编辑器',
        '',
        viewColumn,
        {
          retainContextWhenHidden: true,
          webviewOptions: {
            enableScripts: true,
            enableCommandUris: true,
            localResourceRoots: [vscode.Uri.joinPath(context.value!.extensionUri, 'dist')],
          },
        },
      ).panel
      setWebview(webViewPanel.value.webview)

      // 设置 webview 面板的图标
      setWebviewIcon()
    }
    webViewPanel.value.reveal(viewColumn, true)
    webViewPanel.value.onDidDispose(() => dispose(), null, _disposables)
    webViewPanel.value.webview.html = webviewHandler.setupHtml(webViewPanel.value.webview, context.value!)

    webviewHandler.setupWebviewHooks(webViewPanel.value.webview, _disposables)
  }

  /**
   * Deserializes the webview panel state and restores the panel
   * @param ctx Extension context
   * @param state The serialized state containing the selected entry
   * @param panel The webview panel to restore
   * @returns The restored panel
   */
  const deserialize = (ctx: vscode.ExtensionContext, state: any, panel: vscode.WebviewPanel) => {
    logger.info('Deserializing translation editor panel')

    initialize(ctx)

    // 设置 webview 面板的图标
    setWebviewIcon()

    useTranslationsState().setSingleSelectedEntry(JSON.parse(state))

    return webViewPanel.value
  }

  return {
    initialize,
    render,
    deserialize,
    dispose,
  }
})
