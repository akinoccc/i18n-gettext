import type { TranslationEntry } from '../../types'
import { useWorkspaceFolders } from 'reactive-vscode'
import * as vscode from 'vscode'

import { GETTEXT_FUNCTION_REGEX, PGETTEXT_FUNCTION_REGEX, TEMPLATE_GETTEXT_REGEX } from '../../constants'
import { useTranslationEntries, useTranslationsState } from '../composables'
import { logger } from '../utils/logger'

// Definition provider for gettext functions
export class GettextDefinitionProvider implements vscode.DefinitionProvider {
  // Get workspace folders using reactive API
  private workspaceFolders = useWorkspaceFolders()
  private translationEntries = useTranslationEntries()

  // Use predefined regex patterns for gettext functions
  private gettextFunctionPattern = GETTEXT_FUNCTION_REGEX
  private templateFunctionPattern = TEMPLATE_GETTEXT_REGEX
  private pgettextFunctionPattern = PGETTEXT_FUNCTION_REGEX

  private context: vscode.ExtensionContext

  constructor(context: vscode.ExtensionContext) {
    this.context = context
  }

  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
    const { setSingleSelectedEntry } = useTranslationsState()
    try {
      let entry: TranslationEntry | undefined

      // Get current line text
      const line = document.lineAt(position.line).text

      // First try to match pgettext-style functions (with context)
      const pgettextMatches = [...line.matchAll(this.pgettextFunctionPattern)]
      for (const match of pgettextMatches) {
        const startIndex = match.index || 0
        const textQuote = match[4]
        const text = match[5]

        // Calculate text parameter start and end positions
        const textStartIndex = line.indexOf(textQuote + text + textQuote, startIndex)
        const textEndIndex = textStartIndex + text.length + 2 // +2 for quotes

        // Check if cursor position is within the text parameter
        const cursorIndex = position.character
        if (cursorIndex > textStartIndex && cursorIndex < textEndIndex) {
          // Find corresponding translation entry
          entry = this.translationEntries.findEntryById(text)
          break
        }
      }

      // Then try to match template syntax like {{ $gettext("text") }}
      const templateMatches = [...line.matchAll(this.templateFunctionPattern)]
      for (const match of templateMatches) {
        // For template syntax, we need to check if it's a regular gettext or a pgettext
        // If it has 5 groups, it's likely a pgettext with context and text
        if (match[4] && match[5]) {
          const textQuote = match[4]
          const text = match[5]

          // Calculate text parameter start and end positions
          const fullMatchStr = match[0]
          const textParamStart = fullMatchStr.lastIndexOf(textQuote + text + textQuote)
          const textStartIndex = (match.index || 0) + textParamStart
          const textEndIndex = textStartIndex + text.length + 2 // +2 for quotes

          // Check if cursor position is within the text parameter
          const cursorIndex = position.character
          if (cursorIndex > textStartIndex && cursorIndex < textEndIndex) {
            entry = this.translationEntries.findEntryById(text)
            break
          }
        }
        else {
          // Regular gettext function with just one string parameter
          const textQuote = match[2]
          const text = match[3]

          // Calculate text parameter start and end positions
          const textStartIndex = line.indexOf(textQuote + text + textQuote, match.index || 0)
          const textEndIndex = textStartIndex + text.length + 2 // +2 for quotes

          // Check if cursor position is within the text parameter
          const cursorIndex = position.character
          if (cursorIndex > textStartIndex && cursorIndex < textEndIndex) {
            entry = this.translationEntries.findEntryById(text)
            break
          }
        }
      }

      // Finally try standard gettext function calls
      const matches = [...line.matchAll(this.gettextFunctionPattern)]
      for (const match of matches) {
        const startIndex = match.index || 0
        const quoteChar = match[2]
        const stringValue = match[3]

        // Calculate string parameter start and end positions
        const stringStartIndex = line.indexOf(quoteChar + stringValue + quoteChar, startIndex)
        const stringEndIndex = stringStartIndex + stringValue.length + 2 // +2 for quotes

        // Check if cursor position is within the string parameter
        const cursorIndex = position.character
        if (cursorIndex > stringStartIndex && cursorIndex < stringEndIndex) {
          entry = this.translationEntries.findEntryById(stringValue)
          break
        }
      }

      if (entry) {
        logger.info(vscode.l10n.t('Selecting entry: {entryId}', { entryId: entry.id }))
        setSingleSelectedEntry(entry)
      }
    }
    catch (error) {
      logger.error(vscode.l10n.t('Failed to parse gettext function: {error}', { error }))
    }

    return null
  }
}
