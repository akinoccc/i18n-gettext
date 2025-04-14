import type { ExtensionContext } from 'vscode'
import type { TranslationEntry } from '../state'
import { useCommands as useVscodeCommands } from 'reactive-vscode'
import { useCommandActions } from '../composables'
import { CommandType } from '../constants'
/**
 * 注册所有命令
 */
export function registerCommands(context: ExtensionContext): void {
  // 初始化命令操作
  const commandActions = useCommandActions()

  // 注册公开命令
  useVscodeCommands({
    [CommandType.SELECT_ENTRY]: (entry: TranslationEntry) => commandActions.handleSelectEntry(context, entry),
    [CommandType.SEARCH_ENTRIES]: commandActions.searchEntries,
    [CommandType.CLEAR_SEARCH]: commandActions.clearSearch,
  })
}
