import type { Disposable, ExtensionContext, Webview } from 'vscode'

export class WebviewHelper {
  public static setupHtml(webview: Webview, context: ExtensionContext) {
    return __getWebviewHtml__({
      serverUrl: process.env.VITE_DEV_SERVER_URL || '',
      webview,
      context,
    })
  }

  public static setupWebviewHooks(webview: Webview, callback: (message: any) => void, disposables: Disposable[]) {
    webview.onDidReceiveMessage(
      callback,
      undefined,
      disposables,
    )
  }
}
