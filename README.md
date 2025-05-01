# i18n Gettext for VSCode

基于Gettext的VSCode国际化翻译管理扩展，帮助您轻松处理多语言项目的翻译工作。

## 功能特点

- 🌍 **翻译管理**：集中管理和编辑 PO 翻译文件
- 🔍 **快速搜索**：轻松查找和导航翻译条目
- 📊 **翻译进度**：直观显示项目翻译完成度
- 🤖 **AI翻译**：支持多种AI模型进行高质量翻译，包括Deepseek、OpenAI、Anthropic、Mistral等
- 🔄 **机器翻译**：支持Google翻译引擎
- 📝 **编辑器集成**：专用的翻译编辑界面
- 🔗 **引用导航**：支持从代码直接跳转到对应的翻译条目
- 🔢 **条目过滤**：支持按全部/已翻译/未翻译条目进行筛选

## 安装

在VSCode扩展商店中搜索"i18n Gettext"，点击安装即可使用。

## 要求

- VSCode 1.89.0 或更高版本

## 使用方法

1. **配置翻译文件路径**：
  扩展默认配置翻译文件位于 `src/language/${locale}/${domain}.po`，您可以根据您的项目结构进行自定义。

2. **访问翻译管理面板**：
  点击活动栏中的"i18n Gettext"图标，即可打开翻译管理面板。

3. **查看当前文件翻译**：
  打开包含国际化字符串的文件，在翻译面板中将显示该文件中的所有翻译内容。

4. **多条目批量翻译**：
  点击翻译进度标题栏右侧的【Check Untranslated Entries】按钮打开翻译面板。

4. **编辑翻译**：
  点击任意翻译条目右侧的编辑图标，即可打开翻译编辑器。

5. **查看翻译进度**：
  在"翻译进度"视图中，可以查看项目中各语言的翻译完成度。

6. **搜索翻译条目**：
  使用翻译面板顶部的搜索功能，可以快速查找特定的翻译条目。

7. **过滤翻译条目**：
  使用翻译面板顶部的过滤按钮，可以筛选显示全部/已翻译/未翻译的条目。

8. **使用AI翻译**：
  在翻译编辑器中，可以选择AI模型进行单条或批量翻译。

## 配置选项

在VSCode设置中，可以找到"i18n Gettext"部分，配置以下选项：

默认配置：

```json
{
  "i18n-gettext.localesConfig": {
    "root": ".",
    "type": "nested",
    "basePath": "src/language",
    "pattern": "${locale}/${domain}.po",
    "defaultDomain": "app",
    "sourceLanguage": "en-US"
  },
  "i18n-gettext.translatorConfig": {
    "onlyTranslateUntranslatedAndFuzzy": true,
    "batch": {
      "pageSize": 20
    }
  }
}
```

### localesConfig

- **root**：项目根目录
- **type**：翻译文件组织方式，支持以下几种类型：
  - **flat**：所有翻译文件位于同一目录层级，通常使用 `${locale}.${domain}.po` 格式命名
  - **nested**：翻译文件按语言代码分层组织，形如 `${locale}/${domain}.po`
  - **domain**：翻译文件按域名分层组织，形如 `${domain}/${locale}.po`
  - **custom**：自定义组织方式，完全按照 pattern 定义的模式组织
- **basePath**：翻译文件所在目录（相对于项目根目录）
- **pattern**：翻译文件路径模式，使用 `${locale}` 和 `${domain}` 占位符
- **defaultDomain**：默认域名
- **sourceLanguage**：源语言代码

### translatorConfig

- **onlyTranslateUntranslatedAndFuzzy**: 是否仅翻译未翻译/fuzzy标志的字段
- **batch**:
  - **pageSize**: 批量翻译模式没批次显示的翻译条目数量

## AI翻译配置

要使用AI翻译功能，需要在项目根目录或 `.vscode` 目录下创建 `.i18n-gettext.secret` 配置文件，格式如下：

```json
{
  // 额外补充的 Prompts
  "additionalPrompts": [],

  // 对翻译结果进行质量评审的 AI 模型
  "reviewAI": {
    "provider": "openai",
    "modelId": "gpt-4o",
    "apiKey": "your-api-key"
  },

  // 进行翻译的 AI 模型
  "ai": [
    {
      "provider": "openai",
      "modelId": "gpt-4o",
      "apiKey": "your-api-key"
    },
    {
      "provider": "anthropic",
      "modelId": "claude-3-opus-20240229",
      "apiKey": "your-api-key"
    },
    {
      "provider": "deepseek",
      "modelId": "deepseek-chat",
      "apiKey": "your-api-key"
    }
  ]
}
```

支持的AI提供商包括：
- openai
- deepseek
- ollama
- open-router
- qwen
- anthropic
- mistral
- groq
- cohere
- perplexity
- amazon-bedrock
- azure
- google-vertex
- 等多种AI模型提供商

## 提示与技巧

- 在代码中可以通过定义跳转直接导航到对应的翻译条目
- 在翻译编辑器中，可以一次性编辑多个语言的翻译
- 对于大型项目，可以通过搜索功能快速定位需要修改的翻译
- 使用AI批量翻译功能可以同时翻译多种语言，提高效率
- 翻译条目列表支持按全部/已翻译/未翻译进行筛选，方便管理

## 架构特点

- 基于Vue 3 Composition API风格的组合式函数架构
- 使用reactive-vscode库提供的响应式系统进行状态管理
- 采用单例模式的组合式函数确保状态一致性
- 清晰的依赖关系，避免循环依赖
- 响应式状态自动处理依赖关系变化

## 问题反馈

如果您在使用过程中遇到任何问题，或者有功能建议，请在[GitHub 仓库](https://github.com/akinoccc/i18n-gettext/issues)上提交issue。
