import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { translate } from '@vitalets/google-translate-api'

// Define the l10n directory path
const L10N_DIR = path.resolve(process.cwd(), 'l10n')
// Default language file (source file)
const DEFAULT_BUNDLE = 'bundle.l10n.json'

/**
 * Translate text using the Google Translate API
 * @param text Text to translate
 * @param targetLang Target language code
 * @returns Translated text, empty string if failed
 */
async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    // Skip empty text or special placeholders, avoid无效翻译
    if (!text || text.trim() === '' || text.includes('{') || text.includes('}')) {
      return ''
    }

    const result = await translate(text, { to: targetLang })
    return result.text
  }
  catch (error) {
    console.warn(`Warning: Failed to translate text "${text}" to "${targetLang}":`, error)
    return ''
  }
}

/**
 * Get the language code from the filename
 * @param filename Filename
 * @returns Language code
 */
function getLanguageCode(filename: string): string {
  const langCode = filename.replace('bundle.l10n.', '').replace('.json', '')

  // Convert language code format, compatible with Google Translate API
  // For example: zh-cn -> zh-CN
  if (langCode.includes('-')) {
    const [lang, region] = langCode.split('-')
    return `${lang}-${region.toUpperCase()}`
  }

  return langCode
}

/**
 * Main function: execute l10n export and synchronize keys to other language files
 */
async function main() {
  try {
    // 1. Execute the l10n:export command
    console.log('Executing the l10n:export command...')
    execSync('npx @vscode/l10n-dev export --outDir ./l10n ./extension', { stdio: 'inherit' })
    console.log('✓ l10n export completed')

    // 2. Get the content of the default language file
    const defaultBundlePath = path.join(L10N_DIR, DEFAULT_BUNDLE)
    const defaultBundle = JSON.parse(fs.readFileSync(defaultBundlePath, 'utf-8'))
    console.log(`✓ Default language file loaded: ${DEFAULT_BUNDLE}`)

    // 3. Get all l10n files
    const l10nFiles = fs.readdirSync(L10N_DIR)
      .filter(file => file.startsWith('bundle.l10n.') && file !== DEFAULT_BUNDLE)

    if (l10nFiles.length === 0) {
      console.log('No language files found to synchronize')
      return
    }

    // 4. Process each language file
    for (const file of l10nFiles) {
      const filePath = path.join(L10N_DIR, file)
      let langBundle: Record<string, string> = {}

      // Read the existing language file
      if (fs.existsSync(filePath)) {
        langBundle = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      }

      let newKeysCount = 0
      let translatedCount = 0
      const updatedBundle: Record<string, string> = {}
      const langCode = getLanguageCode(file)

      // Process each key in the default language bundle
      for (const [key, value] of Object.entries(defaultBundle)) {
        if (key in langBundle) {
          // Keep the existing translation
          updatedBundle[key] = langBundle[key]
        }
        else {
          newKeysCount++
          // For new keys, try using Google Translate
          const translatedText = await translateText(value as string, langCode)
          if (translatedText) {
            updatedBundle[key] = translatedText
            translatedCount++
          }
          else {
            // If translation fails, leave it empty
            updatedBundle[key] = ''
          }
        }
      }

      // Save the updated language file
      fs.writeFileSync(filePath, JSON.stringify(updatedBundle, null, 2), 'utf-8')

      console.log(`✓ Updated ${langCode} language file, added ${newKeysCount} new keys, automatically translated ${translatedCount} keys`)
    }

    console.log('✓ All language files synchronized')
  }
  catch (error) {
    console.error('❌ An error occurred during synchronization:', error)
    process.exit(1)
  }
}

main().catch(console.error)
