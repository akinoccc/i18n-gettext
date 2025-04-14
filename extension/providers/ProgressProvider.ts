import type { TreeViewNode } from 'reactive-vscode'
import { computed, createSingletonComposable, useTreeView, watchEffect } from 'reactive-vscode'
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
          label: vscode.l10n.t('尚无翻译数据'),
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
        tooltip: `${locale}\n翻译进度: ${percentage}%\n已翻译: ${translated}\n总条目: ${total}`,
        contextValue: 'localeProgress',
      }

      return { treeItem }
    })
  })

  // 创建树视图
  const view = useTreeView('i18n-gettext.progress', treeData, {
    title: () => {
      const total = statistics.value?.totalEntries ?? 0
      const translated = statistics.value?.translatedEntries ?? 0
      const percentage = total > 0 ? ((translated / total) * 100).toFixed(2) : '0.00'
      return `翻译进度 (${percentage}%)`
    },
  })

  // 初始化数据
  initializeData()

  // 监听状态变化
  watchEffect(() => {
    if (translationTree.value || statistics.value) {
      // 视图会自动更新，无需手动刷新
    }
  })

  return {
    view,
    refreshData: initializeData,
  }
})
