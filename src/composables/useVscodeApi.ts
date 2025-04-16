import type { WebViewMessage } from '../../types'
import { WebviewApi } from '@tomjs/vscode-webview'

interface VscodeApi {
  postMessage: <T>(message: WebViewMessage<T>) => void
  on: <T = any>(type: string, callback: (data: T) => void) => void
  // eslint-disable-next-line ts/no-unsafe-function-type
  off: (type: string, callback: Function) => void
}

export function useVscodeApi(): VscodeApi {
  // 获取VSCode API
  const vscode = new WebviewApi<string>()

  return {
    // 发送消息到扩展
    postMessage(message: any) {
      vscode?.postMessage(message)
    },

    // 注册事件处理器
    on<T>(type: string, callback: (data: T) => void) {
      vscode?.on(type, callback)
    },

    // 移除事件处理器
    // eslint-disable-next-line ts/no-unsafe-function-type
    off(type: string, callback?: Function) {
      vscode?.off(type)
      callback?.()
    },
  }
}
