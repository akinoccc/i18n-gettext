import type { Webview } from 'vscode'
import { createSingletonComposable, shallowRef } from 'reactive-vscode'

export const useWebview = createSingletonComposable(() => {
  const webview = shallowRef<Webview>()

  const setWebview = (newWebview: Webview) => {
    webview.value = newWebview
  }

  return {
    webview,
    setWebview,
  }
})
