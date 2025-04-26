import type { TranslationEntry } from '../../../typings'
import { computed, ref } from 'reactive-vscode'
import * as vscode from 'vscode'
import { useTranslationsState } from '.'
import { logger } from '../../utils'

/**
 * 翻译条目组合式函数
 * 提供对翻译条目的过滤、搜索和选择功能
 */
export function useTranslationEntries() {
  // 获取翻译状态
  const { translationTree, selectedEntries, setSingleSelectedEntry } = useTranslationsState()

  // 搜索文本
  const searchText = ref('')

  // 过滤类型
  const filterType = ref<'all' | 'untranslated' | 'translated'>('all')

  // 计算筛选后的条目
  const filteredEntries = computed(() => {
    if (!translationTree.value)
      return []

    // 先执行搜索过滤
    let entries = translationTree.value.entries
    if (searchText.value) {
      const searchLower = searchText.value.toLowerCase()
      entries = entries.filter(entry =>
        entry.id.toLowerCase().includes(searchLower)
        || (entry.msgctxt && entry.msgctxt.toLowerCase().includes(searchLower)),
      )
    }

    // 再根据翻译状态过滤
    switch (filterType.value) {
      case 'untranslated':
        return entries.filter(entry => entry.hasUntranslated)
      case 'translated':
        return entries.filter(entry => !entry.hasUntranslated)
      default:
        return entries
    }
  })

  // 计算当前文件中的条目
  const fileEntries = (filePath: string, fileContent?: string) => {
    if (!translationTree.value || !filePath)
      return []

    return translationTree.value.entries.filter((entry) => {
      // 检查是否在引用列表中
      if (entry.references.some(ref => ref.includes(filePath))) {
        return true
      }

      // 如果提供了文件内容，在内容中查找
      if (fileContent) {
        const escaped = entry.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const pattern = new RegExp(`['"\`](${escaped})['"\`]`, 'g')
        return pattern.test(fileContent)
      }

      return false
    })
  }

  /**
   * 按本地化键查找条目
   */
  function findEntryById(id: string): TranslationEntry | undefined {
    if (!translationTree.value)
      return undefined

    return translationTree.value.entries.find(entry => entry.id === id)
  }

  /**
   * 设置搜索文本
   */
  function setSearchText(text: string) {
    searchText.value = text
  }

  /**
   * 设置过滤类型
   */
  function setFilterType(type: 'all' | 'untranslated' | 'translated') {
    filterType.value = type
  }

  /**
   * 选择条目进行编辑
   */
  function selectEntry(entry: TranslationEntry) {
    logger.info(vscode.l10n.t('Selecting entry: {entryId}', { entryId: entry.id }))
    setSingleSelectedEntry(entry)
  }

  return {
    // 状态
    searchText,
    filterType,

    // 计算属性
    filteredEntries,

    // 方法
    setSearchText,
    setFilterType,
    selectEntry,
    findEntryById,
    fileEntries,
  }
}
