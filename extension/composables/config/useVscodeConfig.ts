import { createSingletonComposable, defineConfigs } from 'reactive-vscode'
import { logger } from '../../utils'

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
  defaultDomain: string
  /** 源语言 */
  sourceLanguage: string
}

/**
 * 配置组合式函数
 */
export const useVscodeConfig = createSingletonComposable(() => {
  const { localesConfig, translatorConfig } = defineConfigs('i18n-gettext', {
    localesConfig: {
      root: '.',
      type: 'nested',
      basePath: 'src/language',
      pattern: '${locale}/${domain}.po',
      defaultDomain: 'app',
      sourceLanguage: 'en-US',
    } as LocalePattern,
    translatorConfig: {
      onlyTranslateUntranslated: true,
    },
  })

  logger.info(JSON.stringify(localesConfig.value)) 
  logger.info(JSON.stringify(translatorConfig.value))   

  return {
    localesConfig,
    translatorConfig,
  }
})
