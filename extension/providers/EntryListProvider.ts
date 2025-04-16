import type { TreeViewNode } from 'reactive-vscode'
import type { TranslationEntry } from '../state/useTranslationsState'
import { computed, createSingletonComposable, useTreeView } from 'reactive-vscode'
import * as vscode from 'vscode'
import { useTranslationEntries } from '../composables/useTranslationEntries'
import { CommandType } from '../../constants'

/**
 * 翻译条目树视图组合式函数
 */
export const useEntryListTreeView = createSingletonComposable(() => {
  // 使用翻译条目组合式函数
  const translationEntries = useTranslationEntries()

  // 创建树节点数据
  const treeData = computed<TreeViewNode[]>(() => {
    const entries = translationEntries.filteredEntries.value

    if (entries.length === 0) {
      return [{
        treeItem: {
          label: vscode.l10n.t('No translation entries yet'),
          collapsibleState: vscode.TreeItemCollapsibleState.None,
        },
      }]
    }

    return entries.map((entry: TranslationEntry) => {
      const treeItem: vscode.TreeItem = {
        label: entry.id,
        description: entry.msgctxt || '',
        tooltip: `${entry.id}\n${entry.msgctxt || ''}`,
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        contextValue: 'translationEntry',
        command: {
          command: CommandType.SELECT_ENTRY,
          title: vscode.l10n.t('Open translation editor'),
          arguments: [entry],
        },
        iconPath: new vscode.ThemeIcon(
          entry.hasUntranslated ? 'warning' : 'check',
          entry.hasUntranslated
            ? new vscode.ThemeColor('notificationsWarningIcon.foreground')
            : new vscode.ThemeColor('charts.green'),
        ),
      }

      return { treeItem }
    })
  })

  // 创建树视图
  const view = useTreeView('i18n-gettext.entries', treeData, {
    title: () => {
      const total = translationEntries.filteredEntries.value.length
      const searchText = translationEntries.searchText.value
      return searchText
        ? vscode.l10n.t('Translation Entries({total}) - Search: {query}', { total, query: searchText })
        : vscode.l10n.t('Translation Entries({total})', { total })
    },
  })

  /**
   * 设置搜索文本
   */
  function setSearchText(text: string) {
    translationEntries.setSearchText(text)
  }

  /**
   * 设置过滤类型
   */
  function setFilterType(type: 'all' | 'untranslated' | 'translated') {
    translationEntries.setFilterType(type)
  }

  // 返回公开的API
  return {
    view,
    setSearchText,
    setFilterType,
  }
})
