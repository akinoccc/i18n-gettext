/**
 * Command enumeration
 */
export enum CommandType {
  // View commands
  SELECT_ENTRY = 'i18n-gettext.selectEntry',
  REFRESH_ENTRIES = 'i18n-gettext.refreshEntries',
  SEARCH_ENTRIES = 'i18n-gettext.searchEntries',
  CLEAR_SEARCH = 'i18n-gettext.clearSearch',
  NEXT_UNTRANSLATED_ENTRY = 'i18n-gettext.nextUntranslatedEntry',

  // Filter commands
  FILTER_ALL_ENTRIES = 'i18n-gettext.filterAllEntries',
  FILTER_TRANSLATED_ENTRIES = 'i18n-gettext.filterTranslatedEntries',
  FILTER_UNTRANSLATED_ENTRIES = 'i18n-gettext.filterUntranslatedEntries',

  // VSCode built-in commands
  OPEN_WITH = 'vscode.openWith',
}
