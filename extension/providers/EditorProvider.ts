import { watch } from 'reactive-vscode'
import * as vscode from 'vscode'
import { EditorType } from '../../constants'
import { useMessageHandler, useTranslationsState, useWebviewHandler } from '../composables'
import { logger } from '../utils/logger'

export class TranslationEditorProvider {
  public static currentPanel: TranslationEditorProvider | undefined
  public readonly _panel: vscode.WebviewPanel
  private _disposables: vscode.Disposable[] = []

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this._panel = panel
    const { selectedEntry } = useTranslationsState()
    const messageHandler = useMessageHandler()
    const webviewHandler = useWebviewHandler()

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)
    this._panel.webview.html = webviewHandler.setupHtml(this._panel.webview, context)

    webviewHandler.setupWebviewHooks(this._panel.webview, this._disposables)

    watch(selectedEntry, (newEntry) => {
      messageHandler.sendSelectEntryMessage(this._panel.webview, newEntry)
    })
  }

  /**
   * Create or show the translation editor panel
   * @param context Extension context
   * @param viewColumn View column to show the panel in
   * @returns The created or existing panel
   */
  public static render(context: vscode.ExtensionContext, viewColumn: vscode.ViewColumn = vscode.ViewColumn.Beside) {
    if (TranslationEditorProvider.currentPanel) {
      // 第二个参数设置为true，确保面板获得焦点
      TranslationEditorProvider.currentPanel._panel.reveal(viewColumn, true)
    }
    else {
      const panel = vscode.window.createWebviewPanel(
        EditorType.TRANSLATION_EDITOR,
        'i18n Gettext 编辑器',
        viewColumn,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          enableCommandUris: true,
          localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')],
        },
      )

      TranslationEditorProvider.currentPanel = new TranslationEditorProvider(panel, context)
      // 确保新创建的面板获得焦点
      panel.reveal(viewColumn, true)
    }

    return TranslationEditorProvider.currentPanel
  }

  /**
   * Deserializes the webview panel state and restores the panel
   * @param context Extension context
   * @param state The serialized state containing the selected entry
   * @param panel The webview panel to restore
   * @returns The restored panel
   */
  public static deserialize(context: vscode.ExtensionContext, state: any, panel: vscode.WebviewPanel) {
    logger.info('Deserializing translation editor panel')

    // Create a new panel instance with the restored panel
    TranslationEditorProvider.currentPanel = new TranslationEditorProvider(panel, context)
    useTranslationsState().setSelectedEntry(JSON.parse(state))

    return TranslationEditorProvider.currentPanel
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    TranslationEditorProvider.currentPanel = undefined

    // Dispose of the current webview panel
    this._panel.dispose()

    // Dispose of all disposables (i.e. commands) for the current webview panel
    while (this._disposables.length) {
      const disposable = this._disposables.pop()
      if (disposable) {
        disposable.dispose()
      }
    }
  }
}
