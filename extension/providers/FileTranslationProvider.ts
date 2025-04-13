import { computed, useActiveTextEditor, watchEffect } from 'reactive-vscode'
import * as vscode from 'vscode'
import { useTranslationEntries } from '../composables/useTranslationEntries'
import { useTranslationsState } from '../state'

// 当前文件翻译条目Provider
export class FileTranslationProvider implements vscode.TreeDataProvider<FileEntryItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    FileEntryItem | undefined | null | void
  > = new vscode.EventEmitter<FileEntryItem | undefined | null | void>()

  readonly onDidChangeTreeData: vscode.Event<
    FileEntryItem | undefined | null | void
  > = this._onDidChangeTreeData.event

  // 使用响应式API获取活动编辑器
  private activeEditor = useActiveTextEditor()

  // 使用翻译条目组合式函数
  private translationEntries = useTranslationEntries()

  // 计算当前文件中的翻译条目
  private currentFileEntries = computed(() => {
    if (!this.activeEditor.value) {
      return []
    }

    const document = this.activeEditor.value.document
    const text = document.getText()
    const filePath = this.getRelativePath(document.uri.fsPath)

    return this.translationEntries.fileEntries(filePath, text)
  })

  constructor() {
    // 使用响应式API监听编辑器和文档变化
    watchEffect(() => {
      this.refresh()
    })

    // 监听文档变更事件 - 仍需保留此事件监听，因为内容变化不会触发编辑器变化
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (this.activeEditor.value && event.document === this.activeEditor.value.document) {
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

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: FileEntryItem): vscode.TreeItem {
    return element
  }

  getChildren(element?: FileEntryItem): Promise<FileEntryItem[]> {
    if (element) {
      return Promise.resolve([])
    }

    if (!this.activeEditor.value) {
      return Promise.resolve([
        new FileEntryItem(
          vscode.l10n.t('无活动文件'),
          '',
          vscode.TreeItemCollapsibleState.None,
        ),
      ])
    }

    const { translationTree } = useTranslationsState()
    if (!translationTree.value || translationTree.value.entries.length === 0) {
      return Promise.resolve([
        new FileEntryItem(
          vscode.l10n.t('尚无翻译条目'),
          '',
          vscode.TreeItemCollapsibleState.None,
        ),
      ])
    }

    const fileEntries = this.currentFileEntries.value

    if (fileEntries.length === 0) {
      return Promise.resolve([
        new FileEntryItem(
          vscode.l10n.t('本文件未使用翻译条目'),
          '',
          vscode.TreeItemCollapsibleState.None,
        ),
      ])
    }

    return Promise.resolve(
      fileEntries.map((entry) => {
        const treeItem = new FileEntryItem(
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

  // 获取相对路径
  private getRelativePath(absolutePath: string): string {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
      return absolutePath
    }

    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath
    // 移除根路径，保留相对路径
    return absolutePath.replace(rootPath, '').replace(/^[/\\]/, '')
  }
}

// 文件条目项目类
class FileEntryItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(label, collapsibleState)
    this.description = description
    this.tooltip = `${label}\n${description}`
    this.contextValue = 'fileTranslationEntry'
  }
}
