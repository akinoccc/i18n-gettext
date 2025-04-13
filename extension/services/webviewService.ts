import type { Disposable, ExtensionContext, Webview } from 'vscode'
import type { WebViewMessage } from '../constants/message'
import { MessageService } from './messageService'

/**
 * WebView帮助服务
 */
export class WebViewService {
  /**
   * 设置WebView HTML内容
   * @param webview Webview实例
   * @param context 扩展上下文
   * @returns HTML内容
   */
  public static setupHtml(webview: Webview, context: ExtensionContext): string {
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
  public static setupWebviewHooks(webview: Webview, disposables: Disposable[]): void {
    MessageService.setupWebviewHooks(
      webview,
      (message: WebViewMessage) => MessageService.handleMessage(message),
      disposables,
    )
  }
}
