# i18n Gettext VSCode 扩展

一个用于管理和编辑基于 gettext 的翻译字符串的 VSCode 扩展。

## 功能

- 提取代码中的翻译字段
- 显示翻译进度
- 编辑翻译文件
- 自动翻译支持
- 编译翻译文件为 MO 格式

## 优化内容

- 使用 VSCode 自定义编辑器替代 WebView
- 使用原生 TreeView 组件显示翻译条目
- 完全响应式的翻译视图
- 使用 TreeView 展示翻译进度
- 支持按语言筛选显示
- 支持搜索和查找翻译项
- 针对屏幕阅读器的可访问性支持
- 多语言界面支持 (使用 vscode.l10n API)

## 使用方法

1. 在活动栏中点击 i18n Gettext 图标
2. 在翻译进度视图中查看翻译完成情况
3. 在翻译条目视图中浏览和搜索翻译条目
4. 点击任意条目打开翻译编辑器进行编辑
5. 编辑并保存翻译
6. 使用"编译翻译文件"命令生成 MO 文件

## 配置选项

- `i18n-gettext.localesPath`: 本地化文件目录路径 (默认: "src/language")

## 命令

- `i18n-gettext.extract`: 提取翻译字段
- `i18n-gettext.compile`: 编译翻译文件
- `i18n-gettext.refreshView`: 刷新翻译进度
- `i18n-gettext.openTranslationEditor`: 打开翻译编辑器
- `i18n-gettext.searchEntries`: 搜索翻译条目
- `i18n-gettext.clearSearch`: 清除搜索条件

## 界面国际化

扩展使用 VSCode 的 l10n API 实现界面国际化，支持中文和英文界面，自动匹配 VSCode 的语言设置。

## 技术特性

- **原生 TreeView 组件**: 使用 VSCode API 中的 TreeDataProvider 实现高性能的翻译条目浏览
- **自定义编辑器**: 使用 CustomEditorProvider 实现翻译编辑器，提供更好的体验
- **响应式状态管理**: 使用 reactive-vscode 进行状态管理，实现高效的 UI 更新
- **多语言支持**: 使用 vscode.l10n API 实现扩展界面的国际化

## 注意事项

本扩展当前版本为 0.1.0，优化了编辑器实现，使用自定义编辑器代替了 WebView 实现，使界面更加原生，性能更好。

## 功能特性

- **翻译字段提取**：从项目代码中自动扫描并提取所有待翻译的字符串。
- **翻译编译生成JSON文件**：将提取的翻译字段按照语言划分，编译输出成JSON文件。
- **多语言翻译进度监控**：提供直观界面展示每种语言的翻译进度。
- **机器翻译接口调用**：集成机器翻译API，支持自动机翻初步翻译，降低人工翻译成本。

## 使用方法

### 安装扩展

在VSCode扩展市场中搜索"i18n Gettext"并安装。

### 配置扩展

1. 打开VSCode设置（文件 > 首选项 > 设置）
2. 搜索"i18n gettext"
3. 配置以下项目：
   - 扫描配置：包括文件类型、包含/排除目录、正则表达式模式等
   - 编译配置：输出路径、支持的语言、默认语言等
   - 翻译配置：翻译服务提供商、API密钥等

### 基本命令

在命令面板中（Ctrl+Shift+P/Cmd+Shift+P）可以找到以下命令：

- **i18n Gettext: 提取翻译字段** - 从项目中提取待翻译的文本
- **i18n Gettext: 编译翻译文件** - 将提取的翻译字段编译成JSON文件
- **i18n Gettext: 刷新翻译进度** - 更新翻译进度视图
- **i18n Gettext: 打开设置** - 快速打开扩展设置

### 使用翻译编辑器

1. 点击活动栏中的"i18n Gettext"图标
2. 在翻译进度面板中查看每种语言的翻译完成度
3. 使用翻译编辑器进行翻译管理：
   - 选择语言和翻译条目
   - 编辑翻译文本
   - 使用机器翻译功能
   - 查看使用位置并快速跳转

## 支持的文件格式

扩展默认支持以下文件类型中的gettext调用：

- JavaScript (.js)
- TypeScript (.ts)
- JSX文件 (.jsx)
- TSX文件 (.tsx)
- Vue文件 (.vue)
- HTML文件 (.html)

## 机器翻译支持

扩展目前支持以下翻译服务：

- Google Translate
- Microsoft Translator
- 自定义API

要使用机器翻译功能，需要在设置中配置相应的API密钥。

## 贡献

欢迎对此项目进行贡献！请参考CONTRIBUTING.md文件了解详情。

## 许可证

此扩展使用MIT许可证。

## 开发者信息

- 如有问题，请在GitHub上提交issue
- 更多信息请访问[项目主页](https://github.com/yourusername/i18n-gettext)
