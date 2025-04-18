import * as vscode from 'vscode'
import { GETTEXT_FUNCTION_REGEX, PGETTEXT_FUNCTION_REGEX, TEMPLATE_GETTEXT_REGEX } from '../../constants'

import { useTranslationEntries } from '../composables'
import { useLocale } from '../composables/config/useLocale'

// Decoration provider for gettext functions
export class GettextDecorationProvider {
  private translationEntries = useTranslationEntries()
  private disposables: vscode.Disposable[] = []

  // Use predefined regex patterns for gettext functions
  private gettextFunctionPattern = GETTEXT_FUNCTION_REGEX
  private templateFunctionPattern = TEMPLATE_GETTEXT_REGEX
  private pgettextFunctionPattern = PGETTEXT_FUNCTION_REGEX

  // Decoration type for i18n strings
  private i18nDecorationType: vscode.TextEditorDecorationType

  constructor() {
    // Create decoration type with underline and cursor style
    this.i18nDecorationType = vscode.window.createTextEditorDecorationType({
      // textDecoration: 'underline', // Don't use this as it can interfere with other decorations
      border: '1px solid',
      borderColor: new vscode.ThemeColor('editor.foreground'), // Use the same color as the text
      borderStyle: 'none none solid none', // Only bottom border
      borderWidth: '1px',
      cursor: 'pointer', // Show pointer cursor when hovering over the text
      opacity: '0.7', // Add some transparency to make it less intrusive
    })

    // Register event handlers
    this.registerEventHandlers()

    // Force immediate update for all visible editors
    setTimeout(() => {
      this.updateAllVisibleEditors()
    }, 1000)
  }

  /**
   * Update all visible editors with decorations
   */
  private updateAllVisibleEditors(): void {
    // Apply decorations to all visible editors
    vscode.window.visibleTextEditors.forEach((editor) => {
      this.updateDecorations(editor)
    })
  }

  /**
   * Register event handlers for editor changes
   */
  private registerEventHandlers(): void {
    // Update decorations when the active editor changes
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          this.updateDecorations(editor)
        }
      }),
    )

    // Update decorations when the document changes
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.activeTextEditor
        if (editor && event.document === editor.document) {
          this.updateDecorations(editor)
        }
      }),
    )

    // Initial update for the active editor
    if (vscode.window.activeTextEditor) {
      this.updateDecorations(vscode.window.activeTextEditor)
    }
  }

  /**
   * Update decorations in the editor
   * @param editor Text editor to update decorations in
   */
  private updateDecorations(editor: vscode.TextEditor): void {
    const document = editor.document
    const decorations: vscode.DecorationOptions[] = []

    // Process the entire document
    const text = document.getText()

    // First find all pgettext-style functions (with context)
    const pgettextMatches = [...text.matchAll(this.pgettextFunctionPattern)]
    for (const match of pgettextMatches) {
      // const startPos = document.positionAt(match.index || 0) // Unused variable
      const textQuote = match[4]
      const text = match[5]

      // Find the text parameter position
      const textStartIndex = (match.index || 0) + match[0].lastIndexOf(textQuote + text + textQuote)
      const textEndIndex = textStartIndex + text.length + 2 // +2 for quotes

      // Create decoration for the string parameter
      const startPosition = document.positionAt(textStartIndex + 1) // +1 to skip opening quote
      const endPosition = document.positionAt(textEndIndex - 1) // -1 to skip closing quote

      // Check if this is a valid translation entry
      const entry = this.translationEntries.findEntryById(text)

      if (entry) {
        decorations.push({
          range: new vscode.Range(startPosition, endPosition),
          hoverMessage: this.createHoverMessage(entry),
        })
      }
    }

    // Find all template syntax matches
    const templateMatches = [...text.matchAll(this.templateFunctionPattern)]
    for (const match of templateMatches) {
      // For template syntax, we need to check if it's a regular gettext or a pgettext
      // If it has 5 groups, it's likely a pgettext with context and text
      if (match[4] && match[5]) {
        const textQuote = match[4]
        const text = match[5]

        // Find the text parameter position
        const fullMatchStr = match[0]
        const textParamStart = fullMatchStr.lastIndexOf(textQuote + text + textQuote)
        const textStartIndex = (match.index || 0) + textParamStart
        const textEndIndex = textStartIndex + text.length + 2 // +2 for quotes

        // Create decoration for the text parameter
        const startPosition = document.positionAt(textStartIndex + 1) // +1 to skip opening quote
        const endPosition = document.positionAt(textEndIndex - 1) // -1 to skip closing quote

        // Check if this is a valid translation entry
        const entry = this.translationEntries.findEntryById(text)

        if (entry) {
          decorations.push({
            range: new vscode.Range(startPosition, endPosition),
            hoverMessage: this.createHoverMessage(entry),
          })
        }
      }
      // For regular gettext functions, decorate the first parameter
      else if (match[2] && match[3]) {
        const textQuote = match[2]
        const text = match[3]

        // Find the text parameter position
        const textStartIndex = (match.index || 0) + match[0].indexOf(textQuote + text + textQuote)
        const textEndIndex = textStartIndex + text.length + 2 // +2 for quotes

        // Create decoration for the text parameter
        const startPosition = document.positionAt(textStartIndex + 1) // +1 to skip opening quote
        const endPosition = document.positionAt(textEndIndex - 1) // -1 to skip closing quote

        // Check if this is a valid translation entry
        const entry = this.translationEntries.findEntryById(text)

        if (entry) {
          decorations.push({
            range: new vscode.Range(startPosition, endPosition),
            hoverMessage: this.createHoverMessage(entry),
          })
        }
      }
    }

    // Find all standard gettext function calls
    const gettextMatches = [...text.matchAll(this.gettextFunctionPattern)]
    for (const match of gettextMatches) {
      const quoteChar = match[2]
      const stringValue = match[3]

      // Find the string parameter position
      const stringStartIndex = (match.index || 0) + match[0].indexOf(quoteChar + stringValue + quoteChar)
      const stringEndIndex = stringStartIndex + stringValue.length + 2 // +2 for quotes

      // Create decoration for the string parameter
      const startPosition = document.positionAt(stringStartIndex + 1) // +1 to skip opening quote
      const endPosition = document.positionAt(stringEndIndex - 1) // -1 to skip closing quote

      // Check if this is a valid translation entry
      const entry = this.translationEntries.findEntryById(stringValue)

      if (entry) {
        decorations.push({
          range: new vscode.Range(startPosition, endPosition),
          hoverMessage: this.createHoverMessage(entry),
        })
      }
    }

    // Apply decorations to editor
    editor.setDecorations(this.i18nDecorationType, decorations)
  }

  /**
   * Create hover message for a translation entry
   * @param entry Translation entry
   * @returns Hover message
   */
  private createHoverMessage(entry: any): vscode.MarkdownString {
    const message = new vscode.MarkdownString()
    message.isTrusted = true
    message.supportHtml = true

    // Add title
    // message.appendMarkdown('# Translation\n\n')

    // Add context if available
    if (entry.msgctxt) {
      message.appendMarkdown(`**Context:** ${entry.msgctxt}\n`)
    }

    // Add translations header
    message.appendMarkdown('|  |  |\n')
    message.appendMarkdown('| --- | --- |\n')

    // Add translations as table rows
    const locales = Object.keys(entry.locales || {})
    for (const locale of locales) {
      const translation = entry.locales[locale] || 'Not translated'

      // Get locale information including flag
      const { locale: localeInfo } = useLocale(locale)
      const flag = localeInfo?.flag || '🌐'

      // Add as table row with flag
      message.appendMarkdown(`| ${flag} **${locale}** | ${translation} |\n`)
    }

    return message
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.i18nDecorationType.dispose()
    this.disposables.forEach(d => d.dispose())
    this.disposables = []
  }
}
