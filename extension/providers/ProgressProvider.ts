import { watchEffect } from 'reactive-vscode'
import * as vscode from 'vscode'
import { loadTranslations } from '../scanner'
import { useTranslationsState } from '../state'
import { logger } from '../utils/logger'

const { setTranslationTree, statistics, translationTree }
    = useTranslationsState()

// 翻译状态
export class ProgressProvider
implements vscode.TreeDataProvider<ProgressItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    ProgressItem | undefined | null | void
  > = new vscode.EventEmitter<ProgressItem | undefined | null | void>()

  readonly onDidChangeTreeData: vscode.Event<
    ProgressItem | undefined | null | void
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

  getTreeItem(element: ProgressItem): vscode.TreeItem {
    return element
  }

  getChildren(element?: ProgressItem): Thenable<ProgressItem[]> {
    if (element) {
      return Promise.resolve([])
    }

    if (!translationTree.value) {
      return Promise.resolve([
        new ProgressItem(
          vscode.l10n.t('尚无翻译数据'),
          '',
          vscode.TreeItemCollapsibleState.None,
        ),
      ])
    }

    return Promise.resolve(
      translationTree.value.locales.map((data) => {
        const treeItem = new ProgressItem(
          `${data} (${statistics.value?.locales?.[data].translated ?? 0}/${statistics.value?.locales?.[data].total ?? 0})`,
          vscode.l10n.t(
            '{0} 完成',
            `${Math.round(
              ((statistics.value?.locales?.[data].translated ?? 0)
                / (statistics.value?.locales?.[data].total ?? 0))
              * 100,
            )}%`,
          ),
          vscode.TreeItemCollapsibleState.None,
        )

        // // 添加命令以便点击选择该语言
        // treeItem.command = {
        //   command: 'i18n-gettext.selectLanguage',
        //   title: vscode.l10n.t('选择语言: {0}', data),
        //   arguments: [data],
        // }

        return treeItem
      }),
    )
  }
}

// 进度项目类
class ProgressItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(label, collapsibleState)
    this.description = description
  }
}
