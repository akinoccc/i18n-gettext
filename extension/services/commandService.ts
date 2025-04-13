import type { TranslationEntry } from '../state'

import * as vscode from 'vscode'
import { useTranslationsState } from '../state'
import { logger } from '../utils/logger'

const { setSelectedEntry } = useTranslationsState()

/**
 * 命令服务
 */
export class CommandService {
  /**
   * 搜索翻译条目
   */
  public static async searchEntries(): Promise<void> {
    const searchQuery = await vscode.window.showInputBox({
      placeHolder: vscode.l10n.t('输入要搜索的翻译条目关键词'),
      prompt: vscode.l10n.t('在翻译条目中搜索'),
    })

    if (searchQuery) {
      // TODO: 实现搜索功能
      // translatorState.searchText.value = searchQuery;
    }
  }

  /**
   * 清除搜索
   */
  public static clearSearch(): void {
    // TODO: 实现清除搜索功能
    // translatorState.searchText.value = "";
    logger.info(vscode.l10n.t('已清除搜索条件'))
  }

  /**
   * 处理选择条目命令
   * @param context 扩展上下文
   * @param entry 翻译条目
   */
  public static handleSelectEntry(context: vscode.ExtensionContext, entry: TranslationEntry): void {
    setSelectedEntry(entry)
    // 委托给翻译编辑器提供程序处理
    // 注意：我们不能在这里直接调用 TranslationEditorProvider，否则会形成循环依赖
    // 这里通过调用命令来避免循环依赖
    vscode.commands.executeCommand('i18n-gettext._internal.selectEntry', context, entry)
  }
}
