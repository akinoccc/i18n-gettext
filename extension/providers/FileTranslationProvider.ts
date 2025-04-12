import { watchEffect } from 'reactive-vscode'
import * as vscode from 'vscode'
import { useTranslationsState } from '../state'

// 当前文件翻译条目Provider
export class FileTranslationProvider implements vscode.TreeDataProvider<FileEntryItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    FileEntryItem | undefined | null | void
  > = new vscode.EventEmitter<FileEntryItem | undefined | null | void>()

  readonly onDidChangeTreeData: vscode.Event<
    FileEntryItem | undefined | null | void
  > = this._onDidChangeTreeData.event

  // 当前活动编辑器
  private currentEditor: vscode.TextEditor | undefined

  constructor() {
    // 注册编辑器变更事件
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (!editor?.document.uri.path) {
        return
      }
      this.currentEditor = editor
      this.refresh()
    })

    // 注册文档变更事件
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (this.currentEditor && event.document === this.currentEditor.document) {
        this.refresh()
      }
    })

    // 初始化当前编辑器
    this.currentEditor = vscode.window.activeTextEditor

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

    if (!this.currentEditor) {
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

    // 获取当前文件的内容
    const document = this.currentEditor.document
    const text = document.getText()
    const filePath = this.getRelativePath(document.uri.fsPath)

    // 查找当前文件中引用的翻译条目
    const fileEntries = translationTree.value.entries.filter((entry) => {
      // 检查是否在引用列表中
      if (entry.references.some(ref => ref.startsWith(filePath))) {
        return true
      }

      // 在文件内容中查找字符串ID
      // 这是一个简单的检查，可能需要更复杂的正则表达式来匹配gettext调用
      const escaped = this.escapeRegExp(entry.id)
      const pattern = new RegExp(`['"\`](${escaped})['"\`]`, 'g')
      return pattern.test(text)
    })

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

  // 转义正则表达式特殊字符
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
