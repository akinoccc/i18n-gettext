import { WebviewApi } from "@tomjs/vscode-webview"

interface VscodeApi {
  postMessage: (message: any) => void
  on: <T = any>(type: string, callback: (data: T) => void) => void
  // eslint-disable-next-line ts/no-unsafe-function-type
  off: (type: string, callback: Function) => void
}

export function useVscodeApi(): VscodeApi {
  // 获取VSCode API
  const vscode = new WebviewApi<string>()
  // eslint-disable-next-line ts/no-unsafe-function-type
  const handlers = new Map<string, Set<Function>>()

  // 消息处理函数
  function handleMessage(event: MessageEvent) {
    const { type, data } = event.data

    if (type && handlers.has(type)) {
      handlers.get(type)?.forEach(handler => handler(data))
    }
  }

  // 注册消息处理器
  window.addEventListener('message', handleMessage)

  return {
    // 发送消息到扩展
    postMessage(message: any) {
      vscode?.postMessage(message)
    },

    // 注册事件处理器
    on<T>(type: string, callback: (data: T) => void) {
      if (!handlers.has(type)) {
        handlers.set(type, new Set())
      }
      handlers.get(type)?.add(callback)
    },

    // 移除事件处理器
    // eslint-disable-next-line ts/no-unsafe-function-type
    off(type: string, callback: Function) {
      if (handlers.has(type)) {
        handlers.get(type)?.delete(callback)
      }
    },
  }
}


