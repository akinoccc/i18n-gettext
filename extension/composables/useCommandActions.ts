import type { ExtensionContext } from 'vscode'

import type { TranslationEntry } from '../state'
import { createSingletonComposable } from 'reactive-vscode'
import * as vscode from 'vscode'
import { TranslationEditorProvider, useEntryListTreeView } from '../providers'
import { logger } from '../utils/logger'

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
  function handleSelectEntry(context: ExtensionContext, entry: TranslationEntry): void {
    TranslationEditorProvider.handleSelectEntry(context, entry)
  }

  return {
    searchEntries,
    clearSearch,
    handleSelectEntry,
  }
})
