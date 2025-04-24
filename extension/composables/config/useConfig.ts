import { createSingletonComposable, defineConfigs } from 'reactive-vscode'

/**
 * 区域设置模式
 */
export interface LocalePattern {
  /** 根路径 */
  root: string
  /** 目录结构类型 */
  type: 'flat' | 'nested' | 'domain' | 'custom'
  /** 翻译文件的基础路径 */
  basePath: string
  /**
   * 文件路径模式，可使用以下占位符:
   * ${locale} - 语言代码
   * ${domain} - 域名
   */
  pattern: string
  /** 默认域名 */
  defaultDomain?: string
  /** 源语言 */
  sourceLanguage?: string
}

// 导出定义的配置
export const { localesConfig, translator } = defineConfigs('i18n-gettext', {
  localesConfig: {
    root: '.',
    type: 'nested',
    basePath: 'src/language',
    pattern: '${locale}/${domain}.po',
    defaultDomain: 'app',
    sourceLanguage: 'en-US',
  } as LocalePattern,
  translator: {
    onlyTranslateUntranslated: true,
  },
})

/**
 * 配置组合式函数
 */
export const useConfig = createSingletonComposable(() => {
  /**
   * 获取源语言
   */
  function getSourceLanguage(): string | undefined {
    return localesConfig.value.sourceLanguage
  }

  return {
    getSourceLanguage,
  }
})
