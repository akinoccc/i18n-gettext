import { defineConfigs } from 'reactive-vscode'

export const { localesPath } = defineConfigs('i18n-gettext', {
  localesPath: 'src/language',
})
