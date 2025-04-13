import type { ExtensionContext } from 'vscode'
import { useCommands } from 'reactive-vscode'
import { CommandType } from '../constants/command'
import { CommandService } from '../services'

// 注册自定义命令
export function registerCustomCommands(context: ExtensionContext): void {
  useCommands({
    [CommandType.SEARCH_ENTRIES]: CommandService.searchEntries,
    [CommandType.CLEAR_SEARCH]: CommandService.clearSearch,
  })
}
