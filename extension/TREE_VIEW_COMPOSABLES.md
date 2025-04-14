# i18n-gettext 树视图组合式函数使用指南

本文档介绍如何使用 i18n-gettext 扩展中基于 reactive-vscode 的树视图组合式函数。

## 翻译条目树视图 - useEntryListTreeView

`useEntryListTreeView` 组合式函数提供了翻译条目列表的树视图。

```typescript
import { useEntryListTreeView } from './providers'

function someFunction() {
  // 获取翻译条目树视图
  const {
    view, // 视图实例
    setSearchText, // 设置搜索文本
    setFilterType, // 设置过滤类型
  } = useEntryListTreeView()

  // 搜索特定文本
  setSearchText('some-translation-key')

  // 仅显示未翻译条目
  setFilterType('untranslated')

  // 显示所有条目
  setFilterType('all')
}
```

视图会自动根据数据变更进行更新，无需手动刷新。

## 文件翻译树视图 - useFileTranslationTreeView

`useFileTranslationTreeView` 组合式函数提供了当前活动文件中使用的翻译条目的树视图。

```typescript
import { useFileTranslationTreeView } from './providers'

function someFunction() {
  // 获取文件翻译树视图
  const { view } = useFileTranslationTreeView()

  // 视图会自动响应活动编辑器的变化和文档内容的变化
}
```

此视图会自动监听活动编辑器和文档内容的变化，显示当前文件中使用的翻译条目。

## 翻译进度树视图 - useProgressTreeView

`useProgressTreeView` 组合式函数提供了翻译进度的树视图，显示每种语言的翻译完成情况。

```typescript
import { useProgressTreeView } from './providers'

function someFunction() {
  // 获取翻译进度树视图
  const {
    view, // 视图实例
    refreshData, // 刷新数据方法
  } = useProgressTreeView()

  // 手动刷新数据
  await refreshData()
}
```

此视图会自动加载翻译数据并显示每种语言的翻译进度。可以使用 `refreshData` 方法手动刷新数据。

## 在命令服务中使用

命令服务中使用了这些组合式函数来实现搜索和过滤功能：

```typescript
import { useEntryListTreeView } from '../providers'

// 获取翻译条目树视图
const entryListTreeView = useEntryListTreeView()

// 搜索翻译条目
public static async searchEntries(): Promise<void> {
  const searchQuery = await vscode.window.showInputBox({
    placeHolder: vscode.l10n.t('输入要搜索的翻译条目关键词'),
    prompt: vscode.l10n.t('在翻译条目中搜索'),
  })

  if (searchQuery) {
    entryListTreeView.setSearchText(searchQuery)
  }
}

// 清除搜索
public static clearSearch(): void {
  entryListTreeView.setSearchText('')
}
```

## 优势

使用响应式组合式函数的优势包括：

1. **自动响应式更新** - 视图会自动响应数据变化，无需手动刷新
2. **代码简化** - 减少样板代码，不需要手动实现 TreeDataProvider 接口
3. **更好的状态管理** - 状态和行为封装在一个函数中，更易于理解和维护
4. **可组合性** - 可以方便地在多个地方使用这些函数，共享状态和行为

## 迁移指南

如果你还在使用旧的基于类的 API，可以按照以下步骤迁移：

1. 导入并调用相应的组合式函数
2. 使用返回的 API 替代原有的方法调用
3. 删除对旧类的引用

例如：

```typescript
// 旧代码
const entryListProvider = new EntryListProvider()
entryListProvider.setSearchText('search')

// 新代码
const { setSearchText } = useEntryListTreeView()
setSearchText('search')
```

旧的基于类的 API 仍然可用但已标记为已弃用，应尽快迁移到新的组合式 API。
