import type { Disposable, Webview } from 'vscode'
import type { AIBatchTranslateData, AITranslateData, LogData, TranslateByMachineData, TranslationEntry, UpdateTranslationData, WebViewMessage } from '../../../types'

import { createSingletonComposable } from 'reactive-vscode'
import * as vscode from 'vscode'
import { WebViewMessageType } from '../../../constants'
import { logger } from '../../utils/logger'
import { localesConfig } from '../config/useConfig'
import { useModelConfig } from '../config/useModelConfig'
import { usePoEditor } from '../po'
import { useTranslationsState } from '../state'
import { useAITranslator } from '../translation/useAITranslator'
import { useTranslator } from '../translation/useMachineTranslator'

/**
 * Message handler composable function
 */
export const useMessageHandler = createSingletonComposable(() => {
  const { selectedEntry } = useTranslationsState()
  const translator = useTranslator()
  const aiTranslator = useAITranslator()

  /**
   * Set up Webview hooks
   * @param webview Webview instance
   * @param callback Message callback
   * @param disposables Disposable resources list
   */
  function setupWebviewHooks(webview: Webview, callback: (message: WebViewMessage) => void, disposables: Disposable[]): void {
    webview.onDidReceiveMessage(
      callback,
      undefined,
      disposables,
    )
  }

  /**
   * Handle WebView message
   * @param message Message object
   */
  async function handleMessage(message: WebViewMessage, webview: Webview): Promise<void> {
    logger.info(message.type, JSON.stringify(message.data))
    switch (message.type) {
      case WebViewMessageType.WEBVIEW_READY:
        handleWebViewReady(webview)
        break

      case WebViewMessageType.GO_TO_REFERENCE:
        await handleGoToReference(message.data.reference)
        break

      case WebViewMessageType.UPDATE_TRANSLATION:
        await handleUpdateTranslation(message.data as UpdateTranslationData)
        break

      case WebViewMessageType.TRANSLATE_BY_MACHINE:
        await handleTranslateByMachine(message.data as TranslateByMachineData, webview)
        break

      case WebViewMessageType.LOG:
        handleLogMessage(message.data as LogData)
        break

      case WebViewMessageType.AI_TRANSLATE:
        await handleAITranslate(message.data as AITranslateData, webview)
        break

      case WebViewMessageType.AI_BATCH_TRANSLATE:
        await handleAIBatchTranslate(message.data as AIBatchTranslateData, webview)
        break
    }
  }

  /**
   * WebView ready message
   * @param webview Webview instance
   */
  async function handleWebViewReady(webview: Webview) {
    const { sendModelConfigToWebview } = await useModelConfig()
    sendModelConfigToWebview(webview)
    sendSelectEntryMessage(webview, selectedEntry.value)
  }

  /**
   * Handle go to reference message
   * @param filePath File path
   */
  async function handleGoToReference(filePath: string): Promise<boolean> {
    try {
      // Extract file path and line number
      const match = filePath.match(/(.*):(\d+)/)
      if (!match || match.length < 3) {
        logger.warn(vscode.l10n.t('Invalid reference format: {filePath}', { filePath }))
        return false
      }

      const [, path, line] = match
      const lineNumber = Number.parseInt(line, 10)

      // Find file in all workspaces
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        logger.warn(vscode.l10n.t('No workspace folders found'))
        return false
      }

      // Try to find file in each workspace
      for (const folder of vscode.workspace.workspaceFolders) {
        try {
          const fullPath = vscode.Uri.joinPath(folder.uri, path)

          // Check if file exists
          try {
            await vscode.workspace.fs.stat(fullPath)
          }
          catch {
            // File doesn't exist, try next workspace
            continue
          }

          const doc = await vscode.workspace.openTextDocument(fullPath)
          const editor = await vscode.window.showTextDocument(doc)
          const position = new vscode.Position(lineNumber - 1, 0)

          // Set selection range and scroll view to position
          editor.selection = new vscode.Selection(position, position)
          editor.revealRange(
            new vscode.Range(position, position),
            vscode.TextEditorRevealType.InCenter,
          )

          return true // File found and opened
        }
        catch (error) {
          // Continue trying next workspace
          continue
        }
      }

      // All workspaces tried, but file not found
      vscode.window.showWarningMessage(`File not found: ${path}`)
      return false
    }
    catch (error) {
      logger.error(vscode.l10n.t('Failed to open reference file: {error}', { error }))
      vscode.window.showErrorMessage(vscode.l10n.t('Failed to open reference file'))
      return false
    }
  }

  /**
   * Handle update translation message
   * @param data Update translation data
   */
  async function handleUpdateTranslation(data: UpdateTranslationData): Promise<void> {
    try {
      const { entry, locale, value } = data
      await usePoEditor().save(JSON.parse(entry).id, locale, value)
      vscode.window.showInformationMessage(vscode.l10n.t('Translation saved'))
    }
    catch (error) {
      vscode.window.showErrorMessage(vscode.l10n.t('Failed to save translation'))
      logger.error(vscode.l10n.t('Failed to save translation: {error}', { error }))
    }
  }

  /**
   * Handle machine translation message
   * @param data Machine translation data
   * @param webview Webview instance to send the result back
   */
  async function handleTranslateByMachine(data: TranslateByMachineData, webview: Webview): Promise<void> {
    try {
      await translator.handleGoogleTranslate({
        entryId: data.entryId,
        originalCode: data.originalCode,
        targetCode: data.targetCode,
      }, webview)
    }
    catch (error) {
      logger.error(vscode.l10n.t('Machine translation failed: {error}', { error }))
      vscode.window.showErrorMessage(vscode.l10n.t('Machine translation failed'))
      webview.postMessage({
        type: WebViewMessageType.TRANSLATE_BY_MACHINE_RESULT,
        data: {
          result: '',
          targetLanguage: data.originalCode,
          error: error instanceof Error ? error.message : String(error),
        },
      })
    }
  }

  /**
   * Handle AI translation message
   * @param data AI translation data
   */
  async function handleAITranslate(data: AITranslateData, webview: Webview): Promise<void> {
    try {
      await aiTranslator.handleAITranslate(data, webview)

      logger.info(vscode.l10n.t('AI translation completed'))
    }
    catch (error) {
      logger.error(vscode.l10n.t('AI translation failed: {error}', { error }))
      vscode.window.showErrorMessage(vscode.l10n.t('AI translation failed'))
    }
  }

  /**
   * Handle AI batch translation message
   * @param data AI batch translation data
   */
  async function handleAIBatchTranslate(data: AIBatchTranslateData, webview: Webview): Promise<void> {
    try {
      await aiTranslator.handleAIBatchTranslate(data, webview)

      logger.info(vscode.l10n.t('AI batch translation completed'))
    }
    catch (error) {
      logger.error(vscode.l10n.t('AI batch translation failed: {error}', { error }))
      vscode.window.showErrorMessage(vscode.l10n.t('AI batch translation failed'))
    }
  }

  /**
   * Send select entry message to WebView
   * @param webview Webview instance
   * @param entry Translation entry
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

  /**
   * Handle log message
   * @param message Log message
   */
  function handleLogMessage(data: LogData): void {
    logger.info(data.message)
  }

  return {
    setupWebviewHooks,
    handleMessage,
    handleGoToReference,
    handleUpdateTranslation,
    handleTranslateByMachine,
    handleAITranslate,
    handleAIBatchTranslate,
    sendSelectEntryMessage,
    handleLogMessage,
  }
})
