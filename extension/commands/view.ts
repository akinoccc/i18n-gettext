import type { ExtensionContext } from 'vscode'
import type { TranslationEntry } from '../state'
import { useCommands } from 'reactive-vscode'
import { TranslationEditorProvider } from '../providers/EditorProvider'
import { useTranslationsState } from '../state'
import { logger } from '../utils'

export function registerViewCommands(context: ExtensionContext) {
  const { setSelectedEntry } = useTranslationsState()

  useCommands({
    'i18n-gettext.selectEntry': (entry: TranslationEntry) => {
      setSelectedEntry(entry)
      logger.info('selectEntry', entry.id)
      TranslationEditorProvider.handleSelectEntry(context, entry)
    },
  })
}
