# i18n Gettext for VSCode

English | [简体中文](./README.md)

A VSCode extension for managing Gettext-based internationalization translations, helping you easily handle multilingual project translations.

## Features

- 🌍 **Translation Management**: Centrally manage and edit PO translation files
- 🔍 **Quick Search**: Easily find and navigate translation entries
- 📊 **Translation Progress**: Visually display project translation completion
- 🤖 **AI Translation**: Support multiple AI models for high-quality translation, including OpenAI, Anthropic, Mistral, etc.
- 🔄 **Machine Translation**: Support machine translation engines like Google Translate
- 📝 **Editor Integration**: Dedicated translation editing interface
- 🔗 **Reference Navigation**: Jump directly from code to corresponding translation entries
- 📱 **File Monitoring**: Automatically detect and synchronize translation file changes
- 🔢 **Entry Filtering**: Filter by all/translated/untranslated entries

## Installation

Search for "i18n Gettext" in the VSCode extension marketplace and click install to use.

## Requirements

- VSCode 1.89.0 or higher

## Usage

1. **Configure Translation File Path**:
   The extension defaults to translation files located at `src/language/${locale}/${domain}.po`, which you can customize according to your project structure.

2. **Access Translation Management Panel**:
   Click the "i18n Gettext" icon in the activity bar to open the translation management panel.

3. **View Current File Translations**:
   Open a file containing internationalized strings, and all translations in that file will be displayed in the translation panel.

4. **Edit Translations**:
   Click the edit icon to the right of any translation entry to open the translation editor.

5. **View Translation Progress**:
   In the "Translation Progress" view, you can see the translation completion status for each language in the project.

6. **Search Translation Entries**:
   Use the search function at the top of the translation panel to quickly find specific translation entries.

7. **Filter Translation Entries**:
   Use the filter buttons at the top of the translation panel to filter and display all/translated/untranslated entries.

8. **Use AI Translation**:
   In the translation editor, you can select AI models for single or batch translation.

## Configuration Options

In VSCode settings, you can find the "i18n Gettext" section to configure the following options:

```json
{
  "i18n-gettext.localesConfig": {
    "root": ".",
    "type": "nested",
    "basePath": "src/language",
    "pattern": "${locale}/${domain}.po",
    "defaultDomain": "app",
    "sourceLanguage": "en-US"
  }
}
```

- **root**: Project root directory
- **type**: Translation file organization method, supporting the following types:
  - **flat**: All translation files are at the same directory level, typically named in the format `${locale}.${domain}.po`
  - **nested**: Translation files organized by language code, like `${locale}/${domain}.po`
  - **domain**: Translation files organized by domain name, like `${domain}/${locale}.po`
  - **custom**: Custom organization, completely following the pattern defined in the pattern
- **basePath**: directory for translation files(relative to the project root directory)
- **pattern**: Translation file path pattern, using `${locale}` and `${domain}` placeholders
- **defaultDomain**: Default domain name
- **sourceLanguage**: Source language code
- **translator.engines**: Supported translation engines

## AI Translation Configuration

To use the AI translation feature, you need to create a `.i18n-gettext.secret` configuration file in the project root directory or `.vscode` directory, formatted as follows:

```json
{
  "additionalPrompts": [],
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

Supported AI providers include:
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
- deepseek
- amazon-bedrock
- azure
- google-vertex
- and many other AI model providers

## Tips and Tricks

- You can navigate directly to corresponding translation entries through definition jumps in the code
- In the translation editor, you can edit translations for multiple languages at once
- For large projects, you can quickly locate translations that need modification using the search function
- The AI batch translation feature can translate multiple languages simultaneously, improving efficiency
- The translation entry list supports filtering by all/translated/untranslated entries for easier management

## Architecture Features

- Based on Vue 3 Composition API style composable function architecture
- Uses the reactive system provided by the reactive-vscode library for state management
- Adopts singleton pattern composable functions to ensure state consistency
- Clear dependency relationships, avoiding circular dependencies
- Reactive state automatically handles dependency relationship changes

## Feedback

If you encounter any issues during use or have feature suggestions, please submit an issue on [GitHub](https://github.com/akinoccc/i18n-gettext).

## License

[MIT](./LICENSE)

---

**Enjoy a more convenient internationalization development experience!**
