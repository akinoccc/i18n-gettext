import type { TreeViewNode } from 'reactive-vscode'
import { computed, createSingletonComposable, useL10nText, useTreeView, watchEffect } from 'reactive-vscode'
import * as vscode from 'vscode'
import { useScanner } from '../composables'
import { localesConfig } from '../composables/useConfig'
import { useTranslationsState } from '../state'
import { logger } from '../utils/logger'

/**
 * 翻译进度树视图组合式函数
 */
export const useProgressTreeView = createSingletonComposable(() => {
  const { setTranslationTree, statistics, translationTree } = useTranslationsState()
  const scanner = useScanner()

  // 初始化数据
  async function initializeData() {
    try {
      const tree = await scanner.loadTranslations()
      setTranslationTree(tree)
    }
    catch (error) {
      logger.error('初始化翻译数据时发生错误:', error)
    }
  }

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

      const treeItem: vscode.TreeItem = {
        label: `${locale} (${translated}/${total})`,
        description: `${percentage}%${localesConfig.value.sourceLanguage === locale ? ' source' : ''}`,
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        tooltip: `${locale}\nTranslation progress: ${percentage}%\nTranslated: ${translated}\nTotal entries: ${total}`,
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

  // 初始化数据
  initializeData()

  return {
    view,
    refreshData: initializeData,
  }
})
