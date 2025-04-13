import type { TranslationEntry } from '../state/useTranslationsState'
import * as vscode from 'vscode'
import { useTranslationsState } from '../state'
import { saveTranslation } from '../translator'
import { logger } from '../utils/logger'
import { WebviewHelper } from '../WebviewHelper'

// 当前选中的条目
const { setSelectedEntry } = useTranslationsState()

// Webview消息类型
interface WebviewMessage {
  type: string
  data: any
}

// 自定义编辑器提供程序类
export class TranslationEditorProvider {
  public static currentPanel: TranslationEditorProvider | undefined
  private readonly _panel: vscode.WebviewPanel
  private _disposables: vscode.Disposable[] = []

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this._panel = panel

    // this._panel.onDidDispose(() => this.dispose(), null, this._disposables)
    this._panel.webview.html = WebviewHelper.setupHtml(this._panel.webview, context)

    WebviewHelper.setupWebviewHooks(this._panel.webview, this.handleMessage, this._disposables)
  }

  public static render(context: vscode.ExtensionContext) {
    if (TranslationEditorProvider.currentPanel) {
      TranslationEditorProvider.currentPanel._panel.reveal(vscode.ViewColumn.One)
    }
    else {
      const panel = vscode.window.createWebviewPanel(
        'i18n-gettext.translationEditor',
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

  // 处理webview消息
  private async handleMessage(message: WebviewMessage) {
    logger.info('handleMessage', JSON.stringify(message.type))
    switch (message.type) {
      case 'i18n-gettext.goToReference':
        logger.info('goToReference', message.data)
        TranslationEditorProvider.handleGoToReference(message.data.reference)
        break
      case 'i18n-gettext.updateTranslation':
        try {
          const { entry, locale, value } = message.data
          await saveTranslation(JSON.parse(entry), locale, value)
          // 刷新翻译数据
          // await refreshTranslations()
          vscode.window.showInformationMessage(vscode.l10n.t('翻译已保存'))
        }
        catch (error) {
          vscode.window.showErrorMessage(vscode.l10n.t('保存翻译失败'))
          logger.error('保存翻译失败:', error)
        }
        break
    }
  }

  // 处理打开引用
  private static handleGoToReference(filePath: string) {
    try {
      // 提取文件路径和行号
      const match = filePath.match(/(.*):(\d+)/)
      if (!match || match.length < 3) {
        logger.warn('引用格式不正确:', filePath)
        return
      }

      const [, path, line] = match
      const lineNumber = Number.parseInt(line, 10)

      // 在所有工作区中查找文件
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        logger.warn('未找到工作区文件夹')
        return
      }

      // 尝试在每个工作区中找到文件
      const openFileInWorkspaces = async () => {
        for (const folder of vscode.workspace.workspaceFolders!) {
          try {
            const fullPath = vscode.Uri.joinPath(folder.uri, path)

            // 检查文件是否存在
            try {
              await vscode.workspace.fs.stat(fullPath)
            }
            catch {
              // 文件不存在，尝试下一个工作区
              continue
            }

            const doc = await vscode.workspace.openTextDocument(fullPath)
            const editor = await vscode.window.showTextDocument(doc)
            const position = new vscode.Position(lineNumber - 1, 0)

            // 设置选择范围并将视图滚动到该位置
            editor.selection = new vscode.Selection(position, position)
            editor.revealRange(
              new vscode.Range(position, position),
              vscode.TextEditorRevealType.InCenter,
            )

            return true // 文件已找到并打开
          }
          catch (error) {
            // 继续尝试下一个工作区
            continue
          }
        }

        // 所有工作区都尝试过，但未找到文件
        vscode.window.showWarningMessage(`未找到文件: ${path}`)
        return false
      }

      openFileInWorkspaces()
    }
    catch (error) {
      logger.error('打开引用文件时发生错误:', error)
      vscode.window.showErrorMessage('打开引用文件时发生错误')
    }
  }

  // 处理选择条目
  public static handleSelectEntry(context: vscode.ExtensionContext, entry: TranslationEntry) {
    setSelectedEntry(entry)
    TranslationEditorProvider.render(context)
    TranslationEditorProvider.currentPanel?._panel.webview.postMessage({ type: 'i18n-gettext.selectEntry', data: entry })
  }
}
