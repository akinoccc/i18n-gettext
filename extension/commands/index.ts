import type { ExtensionContext } from 'vscode'
import type { TranslationEntry } from '../../types'
import { useCommands as useVscodeCommands } from 'reactive-vscode'
import { CommandType } from '../../constants'
import { useCommandActions } from '../composables'
/**
 * Register all commands
 */
export function registerCommands(context: ExtensionContext): void {
  // Initialize command actions
  const commandActions = useCommandActions()

  // Register public commands
  useVscodeCommands({
    [CommandType.SELECT_ENTRY]: (entry: TranslationEntry) => commandActions.selectEntry(context, entry),
    [CommandType.OPEN_TRANSLATION_EDITOR]: () => commandActions.openTranslationEditor(context),
    [CommandType.SEARCH_ENTRIES]: commandActions.searchEntries,
    [CommandType.CLEAR_SEARCH]: commandActions.clearSearch,
    [CommandType.FILTER_ALL_ENTRIES]: commandActions.filterAllEntries,
    [CommandType.FILTER_TRANSLATED_ENTRIES]: commandActions.filterTranslatedEntries,
    [CommandType.FILTER_UNTRANSLATED_ENTRIES]: commandActions.filterUntranslatedEntries,
    [CommandType.NEXT_UNTRANSLATED_ENTRY]: () => commandActions.nextUntranslatedEntry(context),
  })
}
