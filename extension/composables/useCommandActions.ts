import type { ExtensionContext } from 'vscode'

import type { TranslationEntry } from '../state'
import { createSingletonComposable, extensionContext, useL10nText } from 'reactive-vscode'
import * as vscode from 'vscode'
import { TranslationEditorProvider, useEntryListTreeView } from '../providers'
import { useTranslationsState } from '../state'
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
      placeHolder: useL10nText('输入要搜索的翻译条目关键词').value,
      prompt: useL10nText('在翻译条目中搜索').value,
    })

    if (searchQuery) {
      entryListTreeView.setSearchText(searchQuery)
      logger.info(vscode.l10n.t('搜索翻译条目: {0}', searchQuery))
    }
  }

  /**
   * 清除搜索
   */
  function clearSearch(): void {
    entryListTreeView.setSearchText('')
    logger.info(useL10nText('已清除搜索条件').value)
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
