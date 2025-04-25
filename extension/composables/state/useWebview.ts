import type { Webview } from 'vscode'
import { createSingletonComposable, ref, shallowRef } from 'reactive-vscode'
import { logger } from '../../utils'

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
