# i18n-gettext 组合式函数使用指南

本文档介绍如何使用 i18n-gettext 扩展中的响应式组合式函数。这些函数用于帮助构建基于 reactive-vscode 的扩展功能。

## 翻译加载 - useTranslationLoader

`useTranslationLoader` 组合式函数提供了加载和管理翻译数据的功能。

```typescript
import { useTranslationLoader } from '../composables'

function someFunction() {
  // 获取翻译加载器
  const {
    loadTranslations, // 加载翻译
    refreshTranslations, // 刷新翻译
    clearTranslationCache, // 清除翻译缓存
    isLoading, // 是否正在加载
    needsRefresh, // 是否需要刷新
    cachedTranslationTree, // 缓存的翻译树
  } = useTranslationLoader()

  // 加载翻译数据
  async function loadData() {
    const translationTree = await loadTranslations()
    // 处理加载结果...
  }

  // 刷新翻译数据
  async function refreshData() {
    const translationTree = await refreshTranslations()
    // 处理刷新结果...
  }

  // 使用监听器监听加载状态
  watchEffect(() => {
    if (isLoading.value) {
      console.log('正在加载翻译...')
    }
    else {
      console.log('翻译加载完成')
    }
  })
}
```

## 翻译条目 - useTranslationEntries

`useTranslationEntries` 组合式函数提供了管理和过滤翻译条目的功能。

```typescript
import { useTranslationEntries } from '../composables'

function someFunction() {
  // 获取翻译条目管理器
  const {
    // 状态
    searchText, // 搜索文本
    filterType, // 过滤类型
    selectedEntry, // 当前选中的条目

    // 计算属性
    filteredEntries, // 已过滤的条目

    // 方法
    setSearchText, // 设置搜索文本
    setFilterType, // 设置过滤类型
    selectEntry, // 选择条目
    findEntryById, // 通过ID查找条目
    fileEntries, // 获取文件中的条目
  } = useTranslationEntries()

  // 搜索特定文本
  function search(text: string) {
    setSearchText(text)
    // filteredEntries.value 会自动根据搜索文本进行过滤
  }

  // 仅查看未翻译条目
  function showUntranslated() {
    setFilterType('untranslated')
    // filteredEntries.value 会自动只包含未翻译的条目
  }

  // 仅查看已翻译条目
  function showTranslated() {
    setFilterType('translated')
    // filteredEntries.value 会自动只包含已翻译的条目
  }

  // 查看所有条目
  function showAll() {
    setFilterType('all')
  }

  // 查找特定ID的条目
  function findEntry(id: string) {
    const entry = findEntryById(id)
    if (entry) {
      selectEntry(entry)
    }
  }

  // 获取特定文件中的翻译条目
  function getFileTranslations(filePath: string, fileContent?: string) {
    return fileEntries(filePath, fileContent)
  }
}
```

## 位置 - useLocale

`useLocale` 组合式函数提供了处理区域设置的功能。

```typescript
import { useLocale } from '../composables'

function someFunction() {
  // 获取特定语言代码的区域设置信息
  const { locale } = useLocale('en-US')

  if (locale) {
    console.log(`语言：${locale.code}`)
    console.log(`别名：${locale.alias.join(', ')}`)
  }
  else {
    console.log('未找到语言')
  }
}
```

## 在 Provider 中使用组合式函数

### 在 FileTranslationProvider 中使用

```typescript
import { computed, useActiveTextEditor, watchEffect } from 'reactive-vscode'
import * as vscode from 'vscode'
import { useTranslationEntries } from '../composables'

export class FileTranslationProvider implements vscode.TreeDataProvider<FileEntryItem> {
  private activeEditor = useActiveTextEditor()
  private translationEntries = useTranslationEntries()

  private currentFileEntries = computed(() => {
    if (!this.activeEditor.value) {
      return []
    }

    const document = this.activeEditor.value.document
    const text = document.getText()
    const filePath = this.getRelativePath(document.uri.fsPath)

    return this.translationEntries.fileEntries(filePath, text)
  })

  // 当活动编辑器变化时自动刷新
  constructor() {
    watchEffect(() => {
      if (this.activeEditor.value) {
        this.refresh()
      }
    })
  }

  // 获取子项时直接使用计算属性
  getChildren(): Promise<FileEntryItem[]> {
    return Promise.resolve(
      this.currentFileEntries.value.map(entry => new FileEntryItem(entry))
    )
  }
}
```

### 在 EntryListProvider 中使用

```typescript
import { watchEffect } from 'reactive-vscode'
import * as vscode from 'vscode'
import { useTranslationEntries } from '../composables'

export class EntryListProvider implements vscode.TreeDataProvider<EntryItem> {
  private translationEntries = useTranslationEntries()

  constructor() {
    // 监听搜索条件和过滤类型变化
    watchEffect(() => {
      if (this.translationEntries.searchText.value
        || this.translationEntries.filterType.value !== 'all') {
        this.refresh()
      }
    })
  }

  // 提供公共方法设置搜索条件
  setSearchText(text: string) {
    this.translationEntries.setSearchText(text)
  }

  // 提供公共方法设置过滤类型
  setFilterType(type: 'all' | 'untranslated' | 'translated') {
    this.translationEntries.setFilterType(type)
  }

  // 获取子项时使用过滤后的条目
  getChildren(): Promise<EntryItem[]> {
    return Promise.resolve(
      this.translationEntries.filteredEntries.value.map(entry => new EntryItem(entry))
    )
  }
}
```

## 注意事项

1. 组合式函数返回的响应式对象（如 `ref` 和 `computed`）需要通过 `.value` 访问其值。
2. 要监听响应式对象的变化，请使用 `watchEffect` 或 `watch`。
3. 避免在循环中重复调用组合式函数，应该在组件初始化时调用一次并保存结果。
4. 可以通过提供自定义计算属性来扩展组合式函数的功能。
