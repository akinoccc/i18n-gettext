import type { TranslationEntry } from '../state/useTranslationsState'
import * as vscode from 'vscode'
import { EditorType } from '../constants'
import { MessageService, WebViewService } from '../services'
import { useTranslationsState } from '../state'
import { logger } from '../utils/logger'
import { watch } from 'reactive-vscode'

// 当前选中的条目
const { selectedEntry, setSelectedEntry } = useTranslationsState()

// 自定义编辑器提供程序类
export class TranslationEditorProvider {
  public static currentPanel: TranslationEditorProvider | undefined
  private readonly _panel: vscode.WebviewPanel
  private _disposables: vscode.Disposable[] = []

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this._panel = panel

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)
    this._panel.webview.html = WebViewService.setupHtml(this._panel.webview, context)

    WebViewService.setupWebviewHooks(this._panel.webview, this._disposables)

    watch(selectedEntry, (newEntry) => {
      MessageService.sendSelectEntryMessage(this._panel.webview, newEntry)
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
        vscode.ViewColumn.One,
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

  // 处理选择条目
  public static handleSelectEntry(context: vscode.ExtensionContext, entry: TranslationEntry) {
    logger.info('handleSelectEntry:', JSON.stringify(entry))
    setSelectedEntry(entry)

    // 渲染编辑器
    TranslationEditorProvider.render(context)

    // 发送选择条目消息
    if (TranslationEditorProvider.currentPanel) {
      MessageService.sendSelectEntryMessage(
        TranslationEditorProvider.currentPanel._panel.webview,
        entry,
      )
    }
  }
}
