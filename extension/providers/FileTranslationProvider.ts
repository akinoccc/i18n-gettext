import type { TreeViewNode } from 'reactive-vscode'
import type { TranslationEntry } from '../state'
import { computed, createSingletonComposable, ref, useActiveTextEditor, useL10nText, useTreeView, useWorkspaceFolders } from 'reactive-vscode'
import * as vscode from 'vscode'
import { useTranslationEntries } from '../composables'
import { CommandType } from '../constants'
import { useTranslationsState } from '../state'

/**
 * 当前文件翻译条目视图组合式函数
 */
export const useFileTranslationTreeView = createSingletonComposable(() => {
  // 使用响应式API获取活动编辑器
  const activeEditor = useActiveTextEditor()

  // 保存最后一个有效的项目文件路径和翻译条目
  const lastValidFilePath = ref<string | null>(null)
  const lastValidFileEntries = ref<TranslationEntry[]>([])

  // 使用翻译条目组合式函数
  const translationEntries = useTranslationEntries()

  // 使用翻译状态
  const { translationTree } = useTranslationsState()

  // 获取相对路径
  function getRelativePath(absolutePath: string): string {
    const folders = useWorkspaceFolders()
    if (!folders.value || folders.value.length === 0) {
      return absolutePath
    }

    const rootPath = folders.value[0].uri.fsPath
    // 移除根路径，保留相对路径
    return absolutePath.replace(rootPath, '').replace(/^[/\\]/, '')
  }

  // 检查文件是否为项目内文件
  function isProjectFile(filePath: string): boolean {
    const folders = useWorkspaceFolders()
    if (!folders.value || folders.value.length === 0) {
      return false
    }

    const rootPath = folders.value[0].uri.fsPath
    return filePath.startsWith(rootPath)
  }

  // 计算当前文件中的翻译条目
  const currentFileEntries = computed(() => {
    if (!activeEditor.value) {
      return lastValidFileEntries.value
    }

    const document = activeEditor.value.document
    const absoluteFilePath = document.uri.fsPath

    // 如果不是项目文件，则返回最后一个有效文件的条目
    if (!isProjectFile(absoluteFilePath)) {
      return lastValidFileEntries.value
    }

    const text = document.getText()
    const filePath = getRelativePath(absoluteFilePath)

    // 更新最后一个有效的文件路径和条目
    const entries = translationEntries.fileEntries(filePath, text)
    lastValidFilePath.value = absoluteFilePath
    lastValidFileEntries.value = entries

    return entries
  })

  // 创建树节点数据
  const treeData = computed<TreeViewNode[]>(() => {
    if (!activeEditor.value && lastValidFileEntries.value.length === 0) {
      return [{
        treeItem: {
          label: useL10nText('无活动文件').value,
          collapsibleState: vscode.TreeItemCollapsibleState.None,
        },
      }]
    }

    if (!translationTree.value || translationTree.value.entries.length === 0) {
      return [{
        treeItem: {
          label: useL10nText('尚无翻译条目').value,
          collapsibleState: vscode.TreeItemCollapsibleState.None,
        },
      }]
    }

    const fileEntries = currentFileEntries.value

    if (fileEntries.length === 0) {
      return [{
        treeItem: {
          label: useL10nText('本文件未使用翻译条目').value,
          collapsibleState: vscode.TreeItemCollapsibleState.None,
        },
      }]
    }

    return fileEntries.map((entry: TranslationEntry) => {
      const treeItem: vscode.TreeItem = {
        label: entry.id,
        description: entry.msgctxt || '',
        tooltip: `${entry.id}\n${entry.msgctxt || ''}`,
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        contextValue: 'fileTranslationEntry',
        command: {
          command: CommandType.SELECT_ENTRY,
          title: useL10nText('打开翻译编辑器').value,
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
  const view = useTreeView('i18n-gettext.fileTranslation', treeData, {
    title: () => {
      const count = currentFileEntries.value.length
      const isCurrentFileProject = activeEditor.value && isProjectFile(activeEditor.value.document.uri.fsPath)
      const titlePrefix = isCurrentFileProject ? useL10nText('当前文件').value : useL10nText('上一个项目文件').value
      return `${titlePrefix} (${count}条)`
    },
  })

  return { view }
})
