import { computed, watchEffect } from 'reactive-vscode'
import * as vscode from 'vscode'
import { ScannerService } from '../services'
import { localesConfig } from '../services/configService'
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

  // 使用计算属性获取进度项目
  private progressItems = computed(() => {
    if (!translationTree.value) {
      return [
        new ProgressItem(
          vscode.l10n.t('尚无翻译数据'),
          '',
          vscode.TreeItemCollapsibleState.None,
        ),
      ]
    }

    return translationTree.value.locales.map((data) => {
      const translated = statistics.value?.locales?.[data].translated ?? 0
      const total = statistics.value?.locales?.[data].total ?? 0
      return new ProgressItem(
        `${data} (${translated}/${total})`,
        ((translated / total) * 100).toFixed(2),
        vscode.TreeItemCollapsibleState.None,
        localesConfig.value.sourceLanguage === data,
      )
    })
  })

  constructor() {
    this.initializeData()

    // 使用 watchEffect 监听状态变化并刷新树视图
    watchEffect(() => {
      if (translationTree.value || statistics.value) {
        this.refresh()
      }
    })
  }

  private async initializeData() {
    try {
      const translationTree = await ScannerService.loadTranslations()
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

    return Promise.resolve(this.progressItems.value)
  }
}

// 进度项目类
class ProgressItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly isSource?: boolean,
  ) {
    super(label, collapsibleState)
    this.description = `${description} ${isSource ? 'source' : ''}`
  }
}
