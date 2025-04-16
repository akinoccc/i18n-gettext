/**
 * 命令枚举
 */
export enum CommandType {
  // 视图命令
  SELECT_ENTRY = 'i18n-gettext.selectEntry',

  // 自定义命令
  OPEN_TRANSLATION_EDITOR = 'i18n-gettext.openTranslationEditor',
  SEARCH_ENTRIES = 'i18n-gettext.searchEntries',
  CLEAR_SEARCH = 'i18n-gettext.clearSearch',

  // VSCode内置命令
  OPEN_WITH = 'vscode.openWith',
}
