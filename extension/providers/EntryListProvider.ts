import type { TranslationEntry } from '../state/useTranslationsState'
import { watchEffect } from 'reactive-vscode'
import * as vscode from 'vscode'
import { useTranslationEntries } from '../composables/useTranslationEntries'
import { CommandType } from '../constants'
import { useTranslationsState } from '../state'

// 翻译条目
export class EntryListProvider implements vscode.TreeDataProvider<EntryItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
      EntryItem | undefined | null | void
  > = new vscode.EventEmitter<EntryItem | undefined | null | void>()

  readonly onDidChangeTreeData: vscode.Event<
      EntryItem | undefined | null | void
  > = this._onDidChangeTreeData.event

  // 使用翻译条目组合式函数
  private translationEntries = useTranslationEntries()

  constructor() {
    this.initializeData()
  }

  private async initializeData() {
    // 监听翻译条目的状态变化
    watchEffect(() => {
      if (this.translationEntries.searchText.value || this.translationEntries.filterType.value !== 'all') {
        this.refresh()
      }
    })

    // 监听翻译树变化
    const { translationTree } = useTranslationsState()
    watchEffect(() => {
      if (translationTree.value) {
        this.refresh()
      }
    })
  }

  // 设置搜索文本
  setSearchText(text: string) {
    this.translationEntries.setSearchText(text)
  }

  // 设置过滤类型
  setFilterType(type: 'all' | 'untranslated' | 'translated') {
    this.translationEntries.setFilterType(type)
  }

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: EntryItem): vscode.TreeItem {
    return element
  }

  getChildren(element?: EntryItem): Promise<EntryItem[] | undefined> {
    if (element) {
      return Promise.resolve([])
    }

    // 使用组合式函数获取过滤后的条目
    const entries = this.translationEntries.filteredEntries.value

    if (entries.length === 0) {
      return Promise.resolve([
        new EntryItem(
          vscode.l10n.t('尚无翻译条目'),
          '',
          vscode.TreeItemCollapsibleState.None,
        ),
      ])
    }

    return Promise.resolve(
      entries.map((entry: TranslationEntry) => {
        const treeItem = new EntryItem(
          entry.id,
          entry.msgctxt || '',
          vscode.TreeItemCollapsibleState.None,
        )

        // 添加命令以便点击打开编辑器
        treeItem.command = {
          command: CommandType.SELECT_ENTRY,
          title: vscode.l10n.t('打开翻译编辑器'),
          arguments: [entry],
        }

        // 添加图标
        const hasUntranslated = entry.hasUntranslated
        treeItem.iconPath = new vscode.ThemeIcon(
          hasUntranslated ? 'warning' : 'check',
          hasUntranslated
            ? new vscode.ThemeColor('notificationsWarningIcon.foreground')
            : new vscode.ThemeColor('charts.green'),
        )

        return treeItem
      }),
    )
  }
}

// 条目项目类
class EntryItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(label, collapsibleState)
    this.description = description
    this.tooltip = `${label}\n${description}`
    this.contextValue = 'translationEntry'
  }
}
