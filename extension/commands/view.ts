import type { ExtensionContext } from 'vscode'
import { useCommands } from 'reactive-vscode'
import * as vscode from 'vscode'
import { CommandType } from '../constants/command'
import { TranslationEditorProvider } from '../providers/EditorProvider'
import { CommandService } from '../services'

// 注册视图命令
export function registerViewCommands(context: ExtensionContext): void {
  // 注册公开命令
  useCommands({
    [CommandType.SELECT_ENTRY]: entry => CommandService.handleSelectEntry(context, entry),
  })

  // 注册内部命令，避免循环依赖
  vscode.commands.registerCommand('i18n-gettext._internal.selectEntry', (context: ExtensionContext, entry: any) => {
    TranslationEditorProvider.handleSelectEntry(context, entry)
  })
}
