import * as path from 'node:path'
import { createSingletonComposable } from 'reactive-vscode'
import { useVscodeConfig } from '../config'

export const usePath = createSingletonComposable(() => {
  const { localesConfig } = useVscodeConfig()

  /**
   * 根据配置生成PO文件路径
   * @param locale 语言代码
   * @param domain 域名(可选)，默认使用配置中的defaultDomain
   * @returns 相对于basePath的文件路径
   */
  function getPoFilePath(locale: string, domain: string = localesConfig.value.defaultDomain): string {
    const relativePath = localesConfig.value.pattern
      .replace(/\$\{locale\}/g, locale)
      .replace(/\$\{domain\}/g, domain)

    return relativePath
  }

  /**
   * 根据配置生成语言目录路径
   * @param locale 语言代码
   * @returns 语言对应的目录路径
   */
  function getLocaleDirPath(locale: string): string {
    let dirPath: string

    switch (localesConfig.value.type) {
      case 'flat':
        dirPath = localesConfig.value.basePath
        break
      case 'nested':
      case 'domain':
        dirPath = `${localesConfig.value.basePath}/${locale}`
        break
      case 'custom': {
        // 对于自定义模式，从pattern中提取目录部分
        const pattern = localesConfig.value.pattern
          .replace(/\$\{locale\}/g, locale)
          .replace(/\$\{domain\}/g, '*')
        dirPath = pattern.substring(0, pattern.lastIndexOf('/'))
        break
      }
      default:
        dirPath = `${localesConfig.value.basePath}/${locale}`
        break
    }

    return path.join(localesConfig.value.root, dirPath)
  }

  /**
   * 从文件路径中解析语言和域
   * @param filePath PO文件的完整路径
   * @returns 解析出的语言和域信息，如果无法解析则返回null
   */
  function parsePoFilePath(filePath: string): { locale: string, domain: string } | null {
    const basePath = localesConfig.value.basePath

    if (!filePath.includes(basePath)) {
      return null
    }

    const relativePath = filePath.substring(filePath.indexOf(basePath) + basePath.length + 1)
    let result: { locale: string, domain: string } | null = null

    switch (localesConfig.value.type) {
      case 'flat': {
        // 如: locales/en.po -> en, app
        const match = relativePath.match(/([a-zA-Z_-]+)\.po$/)
        result = match ? { locale: match[1], domain: localesConfig.value.defaultDomain || 'app' } : null
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

  return {
    getPoFilePath,
    getLocaleDirPath,
    parsePoFilePath,
  }
})
