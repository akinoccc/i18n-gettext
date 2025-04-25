import * as fs from 'node:fs'

import * as path from 'node:path'
import { createSingletonComposable } from 'reactive-vscode'
import * as vscode from 'vscode'
import { logger } from '../../utils'
import { useVscodeConfig } from '../config'
import { useTranslationsState } from '../state'
import { usePath } from './usePath'

export const usePoEditor = createSingletonComposable(() => {
  const { getEntryById } = useTranslationsState()
  const { updateTranslation } = useTranslationsState()
  const { localesConfig } = useVscodeConfig()

  // 使用 usePathUtils composable
  const { getPoFilePath } = usePath()

  /**
   * 保存翻译到PO文件
   * @param entry 翻译条目
   * @param locale 语言代码
   * @param value 翻译值
   * @param domain 可选的域名
   * @returns 是否保存成功
   */
  async function save(
    entryId: string,
    locale: string,
    value: string,
    domain?: string,
  ): Promise<boolean> {
    const entry = getEntryById(entryId)

    if (!entry) {
      logger.error(vscode.l10n.t('Entry not found: {entryId}', { entryId }))
      return false
    }

    entry.locales[locale] = value

    try {
      const gettextParser = await import('gettext-parser')
      // 获取根路径
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (!workspaceFolders || workspaceFolders.length === 0) {
        logger.warn(vscode.l10n.t('No workspace folder found'))
        return false
      }

      const rootPath = workspaceFolders[0].uri.fsPath
      const configValue = localesConfig.value
      // 使用 getPoFilePath 替代 config.getPoFilePath
      const poFileRelativePath = getPoFilePath(locale, domain || configValue.defaultDomain)
      const poFilePath = path.join(rootPath, configValue.root, configValue.basePath, poFileRelativePath)

      logger.info(vscode.l10n.t('Saving translation to PO file: {poFilePath}', { poFilePath }))

      // 确保目录存在
      const poFileDir = path.dirname(poFilePath)
      try {
        await fs.promises.mkdir(poFileDir, { recursive: true })
      }
      catch (error) {
        logger.error(vscode.l10n.t('Failed to create directory: {poFileDir}', { poFileDir }))
        throw error
      }

      // 读取现有的po文件，如果不存在则创建新的
      let poData: any
      try {
        const poContent = await fs.promises.readFile(poFilePath)
        poData = gettextParser.po.parse(poContent)
      }
      catch (error) {
        // 如果文件不存在，则创建新的PO数据结构
        logger.info(vscode.l10n.t('Creating new PO file: {poFilePath}', { poFilePath }))
        poData = {
          charset: 'utf-8',
          headers: {
            'Project-Id-Version': 'PACKAGE VERSION',
            'Report-Msgid-Bugs-To': '',
            'POT-Creation-Date': new Date().toISOString(),
            'PO-Revision-Date': new Date().toISOString(),
            'Last-Translator': 'I18n Gettext Extension',
            'Language-Team': locale,
            'Language': locale,
            'MIME-Version': '1.0',
            'Content-Type': 'text/plain; charset=UTF-8',
            'Content-Transfer-Encoding': '8bit',
            'Plural-Forms': 'nplurals=2; plural=(n != 1);',
          },
          translations: {},
        }
      }

      // 更新翻译
      const context = entry.msgctxt || ''
      if (!poData.translations[context]) {
        poData.translations[context] = {}
      }

      // 更新或创建翻译条目
      poData.translations[context][entry.id] = {
        msgid: entry.id,
        msgstr: [value],
        msgctxt: entry.msgctxt,
        comments: {
          reference: Array.isArray(entry.references) ? entry.references.join('\n') : entry.references,
        },
      }

      // 将更新后的数据写回po文件
      const buffer = gettextParser.po.compile(poData)
      await fs.promises.writeFile(poFilePath, buffer)

      // 刷新翻译数据
      updateTranslation(entry)

      // 弹窗提示
      vscode.window.showInformationMessage(vscode.l10n.t('Translation saved: {entryId} [{locale}]', { entryId: entry.id, locale }))

      logger.info(vscode.l10n.t('Translation saved: {entryId} [{locale}]', { entryId: entry.id, locale }))
      return true
    }
    catch (error) {
      logger.error(vscode.l10n.t('Failed to save translation: {error}', { error }))
      throw error
    }
  }

  return {
    save,
  }
})
