import type { Disposable, ExtensionContext, Webview } from 'vscode'
import type { WebViewMessage } from '../../../types'
import { createSingletonComposable } from 'reactive-vscode'
import { useMessageHandler } from './useMessageHandler'
// import { useModelConfig } from '../config/useModelConfig'

/**
 * WebView Handler Composables
 */
export const useWebviewHandler = createSingletonComposable(() => {
  /**
   * Setup WebView HTML content
   * @param webview Webview instance
   * @param context Extension context
   * @returns HTML content
   */
  function setupHtml(webview: Webview, context: ExtensionContext): string {
    return __getWebviewHtml__({
      serverUrl: process.env.VITE_DEV_SERVER_URL || '',
      webview,
      context,
    })
  }

  /**
   * Setup WebView hooks
   * @param webview Webview instance
   * @param disposables Disposable resources list
   */
  async function setupWebviewHooks(webview: Webview, disposables: Disposable[]) {
    const handler = useMessageHandler()

    // Setup message processing hooks
    handler.setupWebviewHooks(
      webview,
      (message: WebViewMessage) => handler.handleMessage(message, webview),
      disposables,
    )
  }

  return {
    setupHtml,
    setupWebviewHooks,
  }
})
