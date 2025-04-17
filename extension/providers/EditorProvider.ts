import { watch } from 'reactive-vscode'
import * as vscode from 'vscode'
import { EditorType } from '../../constants'
import { useMessageHandler, useTranslationsState, useWebviewHandler } from '../composables'

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

  public static render(context: vscode.ExtensionContext) {
    if (TranslationEditorProvider.currentPanel) {
      TranslationEditorProvider.currentPanel._panel.reveal(vscode.ViewColumn.One)
    }
    else {
      const panel = vscode.window.createWebviewPanel(
        EditorType.TRANSLATION_EDITOR,
        'i18n 翻译编辑器',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        },
      )

      TranslationEditorProvider.currentPanel = new TranslationEditorProvider(panel, context)
    }
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
