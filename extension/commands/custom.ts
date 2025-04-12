import type {
  ExtensionContext,
} from 'vscode'
import type { TranslationEntry } from '../state'
import path from 'node:path'
import { useCommands } from 'reactive-vscode'
import {
  commands,
  l10n,
  Uri,
  window,
  workspace,
} from 'vscode'
import { loadTranslations } from '../scanner'
import { useTranslationsState } from '../state'
import { logger } from '../utils'

const {
  setSelectedEntry,
} = useTranslationsState()

// 注册自定义命令
export function registerCustomCommands(context: ExtensionContext): void {
  useCommands({
    'i18n-gettext.openTranslationEditor': openTranslationEditor,
    'i18n-gettext.searchEntries': searchEntries,
    'i18n-gettext.clearSearch': clearSearch,
  })
}

async function openTranslationEditor(entry?: TranslationEntry) {
  try {
    const workspaceFolders = workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) {
      window.showErrorMessage(l10n.t('未找到工作区，无法打开翻译编辑器'))
      return
    }

    // 加载翻译数据
    const tree = await loadTranslations()
    if (!tree || tree.entries.length === 0) {
      window.showWarningMessage(l10n.t('未找到翻译数据'))
      return
    }

    // 创建临时文件路径
    const rootPath = workspaceFolders[0].uri.fsPath
    const translationFilePath = Uri.file(
      path.join(rootPath, '.vscode', 'i18n-translations.i18n-translation'),
    )

    // 确保 .vscode 目录存在
    const vscodeDir = path.join(rootPath, '.vscode')
    try {
      await workspace.fs.createDirectory(Uri.file(vscodeDir))
    }
    catch (error) {
      // 目录可能已存在，忽略错误
    }

    // 将翻译数据写入临时文件
    const translationData = JSON.stringify(tree, null, 2)
    const encoder = new TextEncoder()
    await workspace.fs.writeFile(
      translationFilePath,
      encoder.encode(translationData),
    )

    // 如果有传入特定的条目，设置为选中项
    if (entry) {
      setSelectedEntry(entry)
    }

    // 打开自定义编辑器
    await commands.executeCommand(
      'vscode.openWith',
      translationFilePath,
      'i18n-gettext.translationEditor',
    )

    logger.info(l10n.t('已打开翻译编辑器'))
  }
  catch (error) {
    logger.error(l10n.t('打开翻译编辑器时发生错误'), error)
    window.showErrorMessage(l10n.t('打开翻译编辑器时发生错误'))
  }
}

async function searchEntries() {
  const searchQuery = await window.showInputBox({
    placeHolder: l10n.t('输入要搜索的翻译条目关键词'),
    prompt: l10n.t('在翻译条目中搜索'),
  })

  if (searchQuery) {
    // translatorState.searchText.value = searchQuery;
  }
}

async function clearSearch() {
  // translatorState.searchText.value = "";
  logger.info(l10n.t('已清除搜索条件'))
}
