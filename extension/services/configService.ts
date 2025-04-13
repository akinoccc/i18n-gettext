import { defineConfigs } from 'reactive-vscode'
import * as vscode from 'vscode'

/**
 * 区域设置模式
 */
export interface LocalePattern {
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
export const { localesConfig } = defineConfigs('i18n-gettext', {
  localesConfig: {
    type: 'nested',
    basePath: 'src/language',
    pattern: '${locale}/${domain}.po',
    defaultDomain: 'app',
    sourceLanguage: 'en-US',
  } as LocalePattern,
  translator: {
    engines: ['google'],
  },
})

/**
 * 配置服务类，提供配置相关功能
 */
export class ConfigService {
  /**
   * 获取区域设置路径
   */
  public static get localesPath(): string {
    return localesConfig.value.basePath
  }

  /**
   * 根据配置生成PO文件路径
   * @param locale 语言代码
   * @param domain 域名(可选)，默认使用配置中的defaultDomain
   * @returns 相对于basePath的文件路径
   */
  public static getPoFilePath(
    locale: string,
    domain: string = localesConfig.value.defaultDomain || 'app',
  ): string {
    const config = localesConfig.value

    const relativePath = config.pattern
      .replace(/\$\{locale\}/g, locale)
      .replace(/\$\{domain\}/g, domain)

    return relativePath
  }

  /**
   * 根据配置生成语言目录路径
   * @param locale 语言代码
   * @returns 语言对应的目录路径
   */
  public static getLocaleDirPath(locale: string): string {
    const config = localesConfig.value
    let dirPath: string

    switch (config.type) {
      case 'flat':
        dirPath = config.basePath
        break
      case 'nested':
      case 'domain':
        dirPath = `${config.basePath}/${locale}`
        break
      case 'custom': {
        // 对于自定义模式，从pattern中提取目录部分
        const pattern = config.pattern
          .replace(/\$\{locale\}/g, locale)
          .replace(/\$\{domain\}/g, '*')
        dirPath = pattern.substring(0, pattern.lastIndexOf('/'))
        break
      }
      default:
        dirPath = `${config.basePath}/${locale}`
        break
    }

    return dirPath
  }

  /**
   * 从文件路径中解析语言和域
   * @param filePath PO文件的完整路径
   * @returns 解析出的语言和域信息，如果无法解析则返回null
   */
  public static parsePoFilePath(filePath: string): { locale: string, domain: string } | null {
    const config = localesConfig.value
    const basePath = config.basePath

    if (!filePath.includes(basePath)) {
      return null
    }

    const relativePath = filePath.substring(filePath.indexOf(basePath) + basePath.length + 1)
    let result: { locale: string, domain: string } | null = null

    switch (config.type) {
      case 'flat': {
        // 如: locales/en.po -> en, app
        const match = relativePath.match(/([a-zA-Z_-]+)\.po$/)
        result = match ? { locale: match[1], domain: config.defaultDomain || 'app' } : null
        break
      }
      case 'nested': {
        // 如: locales/en/app.po -> en, app
        const parts = relativePath.split('/')
        if (parts.length >= 2) {
          const domain = parts[1].replace(/\.po$/, '')
          result = { locale: parts[0], domain }
        }
        break
      }
      case 'domain': {
        // 如: locales/en/LC_MESSAGES/domain.po -> en, domain
        const domainParts = relativePath.split('/')
        if (domainParts.length >= 3 && domainParts[1] === 'LC_MESSAGES') {
          const domain = domainParts[2].replace(/\.po$/, '')
          result = { locale: domainParts[0], domain }
        }
        break
      }
      case 'custom': {
        // 尝试从自定义模式中解析
        // 这需要更复杂的逻辑，暂时简单实现
        const customParts = relativePath.split('/')
        if (customParts.length > 0) {
          const fileName = customParts[customParts.length - 1]
          const locale = customParts[0]
          const domain = fileName.replace(/\.po$/, '')
          result = { locale, domain }
        }
        break
      }
      default:
        result = null
        break
    }

    return result
  }

  /**
   * 获取API密钥的辅助函数
   * @param service 服务名称
   * @returns API密钥
   */
  public static getApiKey(service: string): string | undefined {
    const config = vscode.workspace.getConfiguration('i18n-gettext.translator')
    return config.get<string>(`${service}ApiKey`)
  }

  public static get sourceLanguage() {
    return localesConfig.value.sourceLanguage
  }
}
