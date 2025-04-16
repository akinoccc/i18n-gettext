import type { WebViewMessage } from '../../types'
import { WebviewApi } from '@tomjs/vscode-webview'

interface VscodeApi {
  postMessage: <T>(message: WebViewMessage<T>) => void
  on: <T = any>(type: string, callback: (data: T) => void) => void
  // eslint-disable-next-line ts/no-unsafe-function-type
  off: (type: string, callback: Function) => void
}

export function useVscodeApi(): VscodeApi {
  // Get VSCode API
  const vscode = new WebviewApi<string>()

  return {
    // Send message to extension
    postMessage(message: any) {
      vscode?.postMessage(message)
    },

    // Register event handler
    on<T>(type: string, callback: (data: T) => void) {
      vscode?.on(type, callback)
    },

    // Remove event handler
    // eslint-disable-next-line ts/no-unsafe-function-type
    off(type: string, callback?: Function) {
      vscode?.off(type)
      callback?.()
    },
  }
}
