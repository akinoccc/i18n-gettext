# i18n-gettext 扩展架构文档

## 架构简介

i18n-gettext 扩展基于组合式函数架构构建，使用 Vue 3 Composition API 风格的响应式系统进行状态管理和功能实现。这种架构采用了 `reactive-vscode` 库提供的功能，该库在 VSCode 扩展开发中引入了 Vue 的响应式特性。

## 架构优化

本扩展经过架构优化，从传统的 Service 类模式迁移到基于组合式函数的架构。主要优化包括：

1. **Service 转 Composable**: 将所有 Service 类转换为使用 `createSingletonComposable` 创建的组合式函数
2. **统一架构模式**: 确保整个扩展使用一致的架构模式
3. **依赖关系优化**: 使依赖关系更加清晰，避免循环依赖
4. **响应式状态管理**: 利用 Vue 的响应式系统自动处理状态变化

## 主要组合式函数

扩展提供了以下核心组合式函数：

### 状态管理
- `useTranslationsState` - 管理翻译条目的全局状态
- `useTranslationEntries` - 处理翻译条目的过滤、搜索等操作

### 视图
- `useEntryListTreeView` - 提供翻译条目列表视图
- `useFileTranslationTreeView` - 提供当前文件翻译条目视图
- `useProgressTreeView` - 提供翻译进度视图

### 命令
- `useCommandActions` - 提供所有命令操作的实现

### 翻译与配置
- `useConfig` - 提供配置相关功能
- `useTranslator` - 提供翻译相关功能
- `useMessageHandler` - 提供消息处理功能
- `useWebviewHandler` - 提供 WebView 处理功能
- `useScanner` - 提供 PO 文件扫描和解析功能
- `useTranslationLoader` - 提供翻译加载和管理功能

## 优势比较

| 旧架构 (Service 类) | 新架构 (Composable 函数) |
|-------------------|------------------------|
| 依赖注入复杂 | 依赖关系更加清晰 |
| 状态共享困难 | 响应式状态自动处理依赖关系 |
| 可能存在循环依赖 | 减少循环依赖风险 |
| 难以单元测试 | 更容易进行单元测试 |
| 代码重复 | 组合式函数易于复用 |
| 状态不同步问题 | 响应式自动同步状态 |

## 使用示例

```typescript
// 在命令中使用翻译功能
import { useTranslator } from '../composables'

// 在视图中使用条目列表
import { useEntryListTreeView } from '../providers'

function someFunction() {
  const translator = useTranslator()

  async function translateText() {
    const result = await translator.translateByGoogle('Hello, world!', 'zh-CN')
    console.log(result) // 你好，世界！
  }
}

function setupView() {
  const entryListView = useEntryListTreeView()

  // 搜索特定条目
  entryListView.setSearchText('welcome')

  // 显示未翻译条目
  entryListView.setFilterType('untranslated')
}
```

## 架构图

详细的架构流程图请参阅 [ARCHITECTURE.md](./ARCHITECTURE.md) 文件。
