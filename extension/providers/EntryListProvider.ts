import type { TranslationEntry } from '../state/useTranslationsState'
import { watchEffect } from 'reactive-vscode'
import * as vscode from 'vscode'
import { loadTranslations } from '../scanner'
import { useTranslationsState } from '../state'
import { logger } from '../utils/logger'

const { setTranslationTree, translationTree }
  = useTranslationsState()

// 翻译条目
export class EntryListProvider implements vscode.TreeDataProvider<EntryItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
      EntryItem | undefined | null | void
  > = new vscode.EventEmitter<EntryItem | undefined | null | void>()

  readonly onDidChangeTreeData: vscode.Event<
      EntryItem | undefined | null | void
  > = this._onDidChangeTreeData.event

  constructor() {
    this.initializeData()

    // 使用 watchEffect 监听状态变化并刷新树视图
    watchEffect(() => {
      if (translationTree.value) {
        this.refresh()
      }
    })
  }

  private async initializeData() {
    try {
      const translationTree = await loadTranslations()
      setTranslationTree(translationTree)
    }
    catch (error) {
      logger.error('初始化翻译数据时发生错误:', error)
    }
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

    // const tree = translatorState.translationTree.value;
    // if (!tree || tree.entries.length === 0) {
    //   return Promise.resolve([
    //     new EntryItem(
    //       vscode.l10n.t("尚无翻译条目"),
    //       "",
    //       vscode.TreeItemCollapsibleState.None
    //     ),
    //   ]);
    // }

    // 获取搜索文本
    // const searchText = translatorState.searchText.value || "";

    // 过滤条目
    // const filteredEntries = searchText
    //   ? tree.entries.filter(
    //       (entry: TranslationEntry) =>
    //         entry.id.toLowerCase().includes(searchText.toLowerCase()) ||
    //         (entry.msgctxt &&
    //           entry.msgctxt.toLowerCase().includes(searchText.toLowerCase()))
    //     )
    //   : tree.entries;

    return Promise.resolve(
      translationTree.value?.entries.map((entry: TranslationEntry) => {
        const treeItem = new EntryItem(
          entry.id,
          entry.msgctxt || '',
          vscode.TreeItemCollapsibleState.None,
        )

        // 添加命令以便点击打开编辑器
        treeItem.command = {
          command: 'i18n-gettext.selectEntry',
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
