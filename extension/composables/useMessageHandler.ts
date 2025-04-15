import type { Disposable, Webview } from 'vscode'
import type { TranslateByMachineData, UpdateTranslationData, WebViewMessage } from '../constants'
import type { TranslationEntry } from '../state'

import { createSingletonComposable } from 'reactive-vscode'
import * as vscode from 'vscode'
import { WebViewMessageType } from '../constants'
import { useTranslationsState } from '../state'
import { logger } from '../utils/logger'
import { localesConfig } from './useConfig'
import { useTranslator } from './useTranslator'

/**
 * 消息处理组合式函数
 */
export const useMessageHandler = createSingletonComposable(() => {
  const { setSelectedEntry } = useTranslationsState()
  const translator = useTranslator()

  /**
   * 设置Webview钩子
   * @param webview Webview实例
   * @param callback 消息回调
   * @param disposables 可释放资源列表
   */
  function setupWebviewHooks(webview: Webview, callback: (message: WebViewMessage) => void, disposables: Disposable[]): void {
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
  async function handleMessage(message: WebViewMessage): Promise<void> {
    switch (message.type) {
      case WebViewMessageType.GO_TO_REFERENCE:
        await handleGoToReference(message.data.reference)
        break

      case WebViewMessageType.UPDATE_TRANSLATION:
        await handleUpdateTranslation(message.data as UpdateTranslationData)
        break

      case WebViewMessageType.TRANSLATE_BY_MACHINE:
        await handleTranslateByMachine(message.data as TranslateByMachineData)
        break
    }
  }

  /**
   * 处理转到引用消息
   * @param filePath 文件路径
   */
  async function handleGoToReference(filePath: string): Promise<boolean> {
    try {
      // 提取文件路径和行号
      const match = filePath.match(/(.*):(\d+)/)
      if (!match || match.length < 3) {
        logger.warn(vscode.l10n.t('Invalid reference format: {filePath}', { filePath }))
        return false
      }

      const [, path, line] = match
      const lineNumber = Number.parseInt(line, 10)

      // 在所有工作区中查找文件
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        logger.warn(vscode.l10n.t('No workspace folders found'))
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
      logger.error(vscode.l10n.t('Failed to open reference file: {error}', { error }))
      vscode.window.showErrorMessage(vscode.l10n.t('Failed to open reference file'))
      return false
    }
  }

  /**
   * 处理更新翻译消息
   * @param data 更新翻译数据
   */
  async function handleUpdateTranslation(data: UpdateTranslationData): Promise<void> {
    try {
      const { entry, locale, value } = data
      await translator.saveTranslation(JSON.parse(entry), locale, value)
      vscode.window.showInformationMessage(vscode.l10n.t('Translation saved'))
    }
    catch (error) {
      vscode.window.showErrorMessage(vscode.l10n.t('Failed to save translation'))
      logger.error(vscode.l10n.t('Failed to save translation: {error}', { error }))
    }
  }

  /**
   * 处理机器翻译消息
   * @param data 机器翻译数据
   */
  async function handleTranslateByMachine(data: TranslateByMachineData): Promise<void> {
    try {
      const { entry, originalCode, targetCode } = data
      const entryObj = JSON.parse(entry) as TranslationEntry

      const result = await translator.translateByGoogle(entryObj.id, targetCode)
      logger.info(vscode.l10n.t('Machine translation result: {result}', { result }))

      await translator.saveTranslation(entryObj, originalCode, result)

      entryObj.locales[originalCode] = result
      setSelectedEntry(entryObj)
    }
    catch (error) {
      logger.error(vscode.l10n.t('Machine translation failed: {error}', { error }))
      vscode.window.showErrorMessage(vscode.l10n.t('Machine translation failed'))
    }
  }

  /**
   * 发送选择条目消息到WebView
   * @param webview Webview实例
   * @param entry 翻译条目
   */
  function sendSelectEntryMessage(webview: Webview, entry?: TranslationEntry): Thenable<boolean> {
    return webview.postMessage({
      type: WebViewMessageType.SELECT_ENTRY,
      data: {
        ...entry,
        sourceLanguage: localesConfig.value.sourceLanguage,
      },
    })
  }

  return {
    setupWebviewHooks,
    handleMessage,
    handleGoToReference,
    handleUpdateTranslation,
    handleTranslateByMachine,
    sendSelectEntryMessage,
  }
})
