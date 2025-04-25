import type { TreeViewNode } from 'reactive-vscode'
import { computed, createSingletonComposable, useTreeView } from 'reactive-vscode'
import * as vscode from 'vscode'
import { localesMap } from '../../constants/locale'
import { useTranslationsState, useVscodeConfig } from '../composables'

/**
 * 翻译进度树视图组合式函数
 */
export const useProgressTreeView = createSingletonComposable(() => {
  const { statistics, translationTree } = useTranslationsState()
  const { localesConfig } = useVscodeConfig()

  // 创建树节点数据
  const treeData = computed<TreeViewNode[]>(() => {
    if (!translationTree.value) {
      return [{
        treeItem: {
          label: vscode.l10n.t('No translation data yet'),
          collapsibleState: vscode.TreeItemCollapsibleState.None,
        },
      }]
    }

    return translationTree.value.locales.map((locale) => {
      const translated = statistics.value?.locales?.[locale].translated ?? 0
      const total = statistics.value?.locales?.[locale].total ?? 0
      const percentage = ((translated / total) * 100).toFixed(2)

      const isSourceLanguage = localesConfig.value.sourceLanguage === locale

      // 查找匹配的语言配置
      const localeConfig = localesMap.find(item =>
        item.code === locale || item.alias.includes(locale),
      )

      // 获取语言显示名称和国旗
      const localeName = localeConfig ? localeConfig.name : locale
      const localeFlag = localeConfig ? localeConfig.flag : '🏳️'

      const label = isSourceLanguage
        ? `${localeFlag} ${localeName} (${total})`
        : `${localeFlag} ${localeName} (${translated}/${total})`
      const description = isSourceLanguage ? 'source' : `${percentage}%`

      const treeItem: vscode.TreeItem = {
        label,
        description,
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        tooltip: `${locale} - ${localeName}\nTranslation progress: ${percentage}%\nTranslated: ${translated}\nTotal entries: ${total}`,
        contextValue: 'localeProgress',
      }

      return { treeItem }
    })
  })

  // 创建树视图
  const view = useTreeView('i18n-gettext.progress', treeData, {
    title: () => {
      return vscode.l10n.t('Translation Progress')
    },
  })

  return {
    view,
  }
})
