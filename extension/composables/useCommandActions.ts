import type { ExtensionContext } from 'vscode'

import type { TranslationEntry } from '../../types'
import { createSingletonComposable } from 'reactive-vscode'
import * as vscode from 'vscode'
import { TranslationEditorProvider, useEntryListTreeView } from '../providers'
import { useTranslationsState } from '../state'
import { useMessageHandler } from './useMessageHandler'
import { useModelConfig } from './useModelConfig'

/**
 * 命令操作组合式函数
 */
export const useCommandActions = createSingletonComposable(() => {
  const entryListTreeView = useEntryListTreeView()

  /**
   * 搜索翻译条目
   */
  async function searchEntries(): Promise<void> {
    const searchQuery = await vscode.window.showInputBox({
      placeHolder: vscode.l10n.t('Enter keywords to search translation entries'),
      prompt: vscode.l10n.t('Search in translation entries'),
    })

    if (searchQuery) {
      entryListTreeView.setSearchText(searchQuery)
    }
  }

  /**
   * 清除搜索
   */
  function clearSearch(): void {
    entryListTreeView.setSearchText('')
  }

  /**
   * 处理选择条目命令
   * @param entry 翻译条目
   */
  async function handleSelectEntry(context: ExtensionContext, entry: TranslationEntry) {
    useTranslationsState().setSelectedEntry(entry)

    // 渲染编辑器
    TranslationEditorProvider.render(context)

    const modelConfig = await useModelConfig()
    const webview = TranslationEditorProvider.currentPanel?._panel.webview

    if (!webview) {
      return
    }

    // 发送模型配置到 WebView
    modelConfig.sendModelConfigToWebview(webview)

    // 发送选择条目消息
    if (TranslationEditorProvider.currentPanel) {
      useMessageHandler().sendSelectEntryMessage(
        TranslationEditorProvider.currentPanel._panel.webview,
        entry,
      )
    }
  }

  return {
    searchEntries,
    clearSearch,
    handleSelectEntry,
  }
})
