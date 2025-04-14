import type { TreeViewNode } from 'reactive-vscode'
import type { TranslationEntry } from '../state/useTranslationsState'
import { computed, createSingletonComposable, useTreeView, watchEffect } from 'reactive-vscode'
import * as vscode from 'vscode'
import { useTranslationEntries } from '../composables/useTranslationEntries'
import { CommandType } from '../constants'
import { useTranslationsState } from '../state'

/**
 * 翻译条目树视图组合式函数
 */
export const useEntryListTreeView = createSingletonComposable(() => {
  // 使用翻译条目组合式函数
  const translationEntries = useTranslationEntries()
  const { translationTree } = useTranslationsState()

  // 创建树节点数据
  const treeData = computed<TreeViewNode[]>(() => {
    const entries = translationEntries.filteredEntries.value

    if (entries.length === 0) {
      return [{
        treeItem: {
          label: vscode.l10n.t('尚无翻译条目'),
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
          title: vscode.l10n.t('打开翻译编辑器'),
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
      const count = translationEntries.filteredEntries.value.length
      return `翻译条目 (${count})`
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

  // 监听翻译树和搜索过滤条件变化
  watchEffect(() => {
    if (translationTree.value) {
      // 当翻译树更新时，视图会自动刷新
    }
  })

  // 返回公开的API
  return {
    view,
    setSearchText,
    setFilterType,
  }
})
