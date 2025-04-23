import type { Webview } from 'vscode'
import type { ModelConfig } from '../../../types'

import { createSingletonComposable, reactive, useFsWatcher } from 'reactive-vscode'
import * as vscode from 'vscode'
import { WebViewMessageType } from '../../../constants'
import { logger } from '../../utils/logger'

/**
 * 模型配置组合式函数
 */
export const useModelConfig = createSingletonComposable(async () => {
  const { loadConfig } = await import('unconfig')
  let currentWebview: Webview | null = null

  // 使用reactive创建响应式的globs集合
  const configPatterns = reactive(new Set<string>())
  let cleanupWatcher: (() => void) | null = null

  /**
   * 读取模型配置信息
   * @returns 返回配置信息，如果读取失败则返回空数组
   */
  async function readModelConfig(): Promise<ModelConfig[]> {
    try {
      // 获取工作区文件夹
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (!workspaceFolders || workspaceFolders.length === 0) {
        logger.warn(vscode.l10n.t('No workspace folders found'))
        return []
      }

      // 项目根目录
      const rootPath = workspaceFolders[0].uri.fsPath

      // 使用 unconfig 加载配置
      const { config } = await loadConfig<{ ai: ModelConfig[] }>({
        cwd: rootPath,
        sources: [
          // 尝试加载 .vscode/.i18n-gettext.secret 配置
          {
            files: [
              '.vscode/.i18n-gettext.secret',
            ],
            parser: 'auto',
          },
          // 尝试加载 .i18n-gettext.secret 配置
          {
            files: [
              '.i18n-gettext.secret',
            ],
            parser: 'auto',
          },
        ],

        merge: true,
      })

      logger.info('config', JSON.stringify(config))

      // 检查配置
      if (!config || !config.ai || !Array.isArray(config.ai)) {
        logger.warn(vscode.l10n.t('No AI configuration found in config files'))
        return []
      }

      return config.ai
    }
    catch (error) {
      logger.error(vscode.l10n.t('Failed to read model config: {error}', { error }))
      return []
    }
  }

  /**
   * 发送模型配置到 WebView
   * @param webview Webview 实例
   */
  async function sendModelConfigToWebview(webview: Webview): Promise<boolean> {
    try {
      currentWebview = webview
      const models = await readModelConfig()

      logger.info('Models: ', JSON.stringify(models))

      const result = await webview.postMessage({
        type: WebViewMessageType.SEND_MODEL_CONFIG,
        data: {
          models: JSON.stringify(models),
        },
      })

      return result
    }
    catch (error) {
      logger.error(vscode.l10n.t('Failed to send model config to webview: {error}', { error }))
      return false
    }
  }

  /**
   * 监听配置文件变化
   * 当配置文件发生变化时，自动向 webview 发送更新后的配置
   * @returns 返回清理函数
   */
  function watchModelConfigChanges(): () => void {
    // 如果已存在清理函数，先清理旧的监听器
    if (cleanupWatcher) {
      cleanupWatcher()
      cleanupWatcher = null
    }

    // 获取工作区文件夹
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) {
      logger.warn(vscode.l10n.t('No workspace folders found for file watching'))
      return () => {}
    }

    // 清空并设置新的监听模式
    configPatterns.clear()
    configPatterns.add('**/.vscode/.i18n-gettext.secret.*')
    configPatterns.add('**/.i18n-gettext.secret.*')

    // 使用 useFsWatcher 创建响应式的文件监听器
    const watcher = useFsWatcher(configPatterns)

    // 处理配置文件变化的函数
    const handleConfigChange = async (uri: vscode.Uri) => {
      logger.info(vscode.l10n.t('Model config file changed: {uri}', { uri: uri.toString() }))
      if (currentWebview) {
        await sendModelConfigToWebview(currentWebview)
        logger.info(vscode.l10n.t('Webview model config updated'))
      }
    }

    // 监听文件变化事件
    watcher.onDidCreate(handleConfigChange)
    watcher.onDidChange(handleConfigChange)
    watcher.onDidDelete(handleConfigChange)

    logger.info(vscode.l10n.t('Model config file watcher initialized with reactive patterns'))

    // 保存清理函数，用于在下次调用前清理
    cleanupWatcher = () => {
      configPatterns.clear()
      // useFsWatcher 会自动处理资源的清理，不需要手动调用 dispose
    }

    return cleanupWatcher
  }

  return {
    readModelConfig,
    sendModelConfigToWebview,
    watchModelConfigChanges,
  }
})
