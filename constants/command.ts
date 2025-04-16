/**
 * Command enumeration
 */
export enum CommandType {
  // View commands
  SELECT_ENTRY = 'i18n-gettext.selectEntry',

  // Custom commands
  OPEN_TRANSLATION_EDITOR = 'i18n-gettext.openTranslationEditor',
  SEARCH_ENTRIES = 'i18n-gettext.searchEntries',
  CLEAR_SEARCH = 'i18n-gettext.clearSearch',

  // VSCode built-in commands
  OPEN_WITH = 'vscode.openWith',
}
