import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { translate } from '@vitalets/google-translate-api'

// 定义l10n目录路径
const L10N_DIR = path.resolve(process.cwd(), 'l10n')
// 默认语言文件（源文件）
const DEFAULT_BUNDLE = 'bundle.l10n.json'

/**
 * 使用Google翻译API翻译文本
 * @param text 待翻译文本
 * @param targetLang 目标语言代码
 * @returns 翻译后的文本，失败则返回空字符串
 */
async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    // 跳过空文本或特殊占位符，避免无效翻译
    if (!text || text.trim() === '' || text.includes('{') || text.includes('}')) {
      return ''
    }

    const result = await translate(text, { to: targetLang })
    return result.text
  }
  catch (error) {
    console.warn(`警告: 翻译文本"${text}"到"${targetLang}"失败:`, error)
    return ''
  }
}

/**
 * 根据文件名获取语言代码
 * @param filename 文件名
 * @returns 语言代码
 */
function getLanguageCode(filename: string): string {
  const langCode = filename.replace('bundle.l10n.', '').replace('.json', '')

  // 转换语言代码格式，适配Google翻译API
  // 例如：zh-cn -> zh-CN
  if (langCode.includes('-')) {
    const [lang, region] = langCode.split('-')
    return `${lang}-${region.toUpperCase()}`
  }

  return langCode
}

/**
 * 主函数：执行l10n导出并同步键到其他语言文件
 */
async function main() {
  try {
    // 1. 执行l10n:export命令
    console.log('执行l10n:export命令...')
    execSync('npx @vscode/l10n-dev export --outDir ./l10n ./extension', { stdio: 'inherit' })
    console.log('✓ l10n导出完成')

    // 2. 获取默认语言文件内容
    const defaultBundlePath = path.join(L10N_DIR, DEFAULT_BUNDLE)
    const defaultBundle = JSON.parse(fs.readFileSync(defaultBundlePath, 'utf-8'))
    console.log(`✓ 已加载默认语言文件: ${DEFAULT_BUNDLE}`)

    // 3. 获取所有l10n文件
    const l10nFiles = fs.readdirSync(L10N_DIR)
      .filter(file => file.startsWith('bundle.l10n.') && file !== DEFAULT_BUNDLE)

    if (l10nFiles.length === 0) {
      console.log('未找到需要同步的语言文件')
      return
    }

    // 4. 处理每个语言文件
    for (const file of l10nFiles) {
      const filePath = path.join(L10N_DIR, file)
      let langBundle: Record<string, string> = {}

      // 读取现有的语言文件
      if (fs.existsSync(filePath)) {
        langBundle = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      }

      let newKeysCount = 0
      let translatedCount = 0
      const updatedBundle: Record<string, string> = {}
      const langCode = getLanguageCode(file)

      // 处理默认语言包中的每个键
      for (const [key, value] of Object.entries(defaultBundle)) {
        if (key in langBundle) {
          // 保留现有的翻译
          updatedBundle[key] = langBundle[key]
        }
        else {
          newKeysCount++
          // 对于新键，尝试使用Google翻译
          const translatedText = await translateText(value as string, langCode)
          if (translatedText) {
            updatedBundle[key] = translatedText
            translatedCount++
          }
          else {
            // 翻译失败则留空
            updatedBundle[key] = ''
          }
        }
      }

      // 保存更新后的语言文件
      fs.writeFileSync(filePath, JSON.stringify(updatedBundle, null, 2), 'utf-8')

      console.log(`✓ 已更新 ${langCode} 语言文件，添加了 ${newKeysCount} 个新键，自动翻译了 ${translatedCount} 个`)
    }

    console.log('✓ 所有语言文件同步完成')
  }
  catch (error) {
    console.error('❌ 同步过程中出现错误:', error)
    process.exit(1)
  }
}

// 执行主函数
main().catch(console.error)
