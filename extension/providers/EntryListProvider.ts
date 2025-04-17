import type { TreeViewNode } from 'reactive-vscode'
import type { TranslationEntry } from '../../types'
import { computed, createSingletonComposable, useTreeView } from 'reactive-vscode'
import * as vscode from 'vscode'
import { CommandType } from '../../constants'
import { useTranslationEntries } from '../composables'
import { useTranslationsState } from '../composables/state'

/**
 * Translation entry tree view composable function
 */
export const useEntryListTreeView = createSingletonComposable(() => {
  // Use translation entry composable
  const translationEntries = useTranslationEntries()

  // Create tree node data
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

  // 获取翻译状态
  const { statistics } = useTranslationsState()

  // Create tree view
  const view = useTreeView('i18n-gettext.entries', treeData, {
    title: () => {
      const total = translationEntries.filteredEntries.value.length
      const searchText = translationEntries.searchText.value
      const filterType = translationEntries.filterType.value

      // 获取统计信息
      const totalEntries = statistics.value?.totalEntries || 0
      const translatedEntries = statistics.value?.translatedEntries || 0
      const untranslatedEntries = statistics.value?.untranslatedEntries || 0

      // 根据过滤类型显示不同的标题
      let titlePrefix = ''
      switch (filterType) {
        case 'translated':
          titlePrefix = vscode.l10n.t('Translated({total})', {
            total,
            totalEntries,
          })
          break
        case 'untranslated':
          titlePrefix = vscode.l10n.t('Untranslated({total})', {
            total,
            totalEntries,
          })
          break
        default:
          titlePrefix = vscode.l10n.t('All({total}) [✓{translated} ⚠{untranslated}]', {
            total: totalEntries,
            translated: translatedEntries,
            untranslated: untranslatedEntries,
          })
      }

      return searchText
        ? `${titlePrefix} - ${vscode.l10n.t('Search: {query}', { query: searchText })}`
        : titlePrefix
    },
  })

  /**
   * Set search text
   */
  function setSearchText(text: string) {
    translationEntries.setSearchText(text)
  }

  /**
   * Set filter type
   */
  function setFilterType(type: 'all' | 'untranslated' | 'translated') {
    translationEntries.setFilterType(type)
  }

  // Return public API
  return {
    view,
    setSearchText,
    setFilterType,
  }
})
