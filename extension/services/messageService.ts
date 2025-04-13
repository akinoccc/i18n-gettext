import type { Disposable, Webview } from 'vscode'
import type { TranslateByMachineData, UpdateTranslationData, WebViewMessage } from '../constants/message'

import type { TranslationEntry } from '../state'
import * as vscode from 'vscode'
import { WebViewMessageType } from '../constants/message'
import { useTranslationsState } from '../state'
import { logger } from '../utils/logger'
import { localesConfig } from './configService'
import { TranslatorService } from './translatorService'

const { setSelectedEntry } = useTranslationsState()

/**
 * 消息处理服务
 */
export class MessageService {
  /**
   * 设置Webview钩子
   * @param webview Webview实例
   * @param callback 消息回调
   * @param disposables 可释放资源列表
   */
  public static setupWebviewHooks(webview: Webview, callback: (message: WebViewMessage) => void, disposables: Disposable[]): void {
    webview.onDidReceiveMessage(
      callback,
      undefined,
      disposables,
    )
  }

  /**
   * 处理WebView消息
   * @param message 消息对象
   */
  public static async handleMessage(message: WebViewMessage): Promise<void> {
    logger.info('处理WebView消息:', message.type)

    switch (message.type) {
      case WebViewMessageType.GO_TO_REFERENCE:
        await MessageService.handleGoToReference(message.data.reference)
        break

      case WebViewMessageType.UPDATE_TRANSLATION:
        await MessageService.handleUpdateTranslation(message.data as UpdateTranslationData)
        break

      case WebViewMessageType.TRANSLATE_BY_MACHINE:
        await MessageService.handleTranslateByMachine(message.data as TranslateByMachineData)
        break
    }
  }

  /**
   * 处理转到引用消息
   * @param filePath 文件路径
   */
  private static async handleGoToReference(filePath: string): Promise<boolean> {
    try {
      // 提取文件路径和行号
      const match = filePath.match(/(.*):(\d+)/)
      if (!match || match.length < 3) {
        logger.warn('引用格式不正确:', filePath)
        return false
      }

      const [, path, line] = match
      const lineNumber = Number.parseInt(line, 10)

      // 在所有工作区中查找文件
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        logger.warn('未找到工作区文件夹')
        return false
      }

      // 尝试在每个工作区中找到文件
      for (const folder of vscode.workspace.workspaceFolders) {
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
    catch (error) {
      logger.error('打开引用文件时发生错误:', error)
      vscode.window.showErrorMessage('打开引用文件时发生错误')
      return false
    }
  }

  /**
   * 处理更新翻译消息
   * @param data 更新翻译数据
   */
  private static async handleUpdateTranslation(data: UpdateTranslationData): Promise<void> {
    try {
      const { entry, locale, value } = data
      await TranslatorService.saveTranslation(JSON.parse(entry), locale, value)
      vscode.window.showInformationMessage(vscode.l10n.t('翻译已保存'))
    }
    catch (error) {
      vscode.window.showErrorMessage(vscode.l10n.t('保存翻译失败'))
      logger.error('保存翻译失败:', error)
    }
  }

  /**
   * 处理机器翻译消息
   * @param data 机器翻译数据
   */
  private static async handleTranslateByMachine(data: TranslateByMachineData): Promise<void> {
    try {
      const { entry, originalCode, targetCode } = data
      const entryObj = JSON.parse(entry) as TranslationEntry

      const result = await TranslatorService.translateByGoogle(entryObj.id, targetCode)
      logger.info('机器翻译结果:', result)

      await TranslatorService.saveTranslation(entryObj, originalCode, result)

      entryObj.locales[originalCode] = result
      setSelectedEntry(entryObj)
    }
    catch (error) {
      logger.error('机器翻译失败:', error)
      vscode.window.showErrorMessage(vscode.l10n.t('机器翻译失败'))
    }
  }

  /**
   * 发送选择条目消息到WebView
   * @param webview Webview实例
   * @param entry 翻译条目
   */
  public static sendSelectEntryMessage(webview: Webview, entry?: TranslationEntry): Thenable<boolean> {
    return webview.postMessage({
      type: WebViewMessageType.SELECT_ENTRY,
      data: {
        ...entry,
        sourceLanguage: localesConfig.value.sourceLanguage,
      },
    })
  }
}
