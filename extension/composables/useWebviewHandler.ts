import type { Disposable, ExtensionContext, Webview } from 'vscode'
import type { WebViewMessage } from '../../types'
import { createSingletonComposable } from 'reactive-vscode'
import { useMessageHandler } from './useMessageHandler'
import { useModelConfig } from './useModelConfig'

/**
 * WebView处理组合式函数
 */
export const useWebviewHandler = createSingletonComposable(() => {
  /**
   * 设置WebView HTML内容
   * @param webview Webview实例
   * @param context 扩展上下文
   * @returns HTML内容
   */
  function setupHtml(webview: Webview, context: ExtensionContext): string {
    return __getWebviewHtml__({
      serverUrl: process.env.VITE_DEV_SERVER_URL || '',
      webview,
      context,
    })
  }

  /**
   * 设置WebView钩子
   * @param webview Webview实例
   * @param disposables 可释放资源列表
   */
  async function setupWebviewHooks(webview: Webview, disposables: Disposable[]) {
    const handler = useMessageHandler()

    // 设置消息处理钩子
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
