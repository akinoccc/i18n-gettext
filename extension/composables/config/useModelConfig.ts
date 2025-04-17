import type { Webview } from 'vscode'
import type { ModelConfig } from '../../../types'

import { createSingletonComposable } from 'reactive-vscode'
import * as vscode from 'vscode'
import { WebViewMessageType } from '../../../constants'
import { logger } from '../../utils/logger'

/**
 * 模型配置组合式函数
 */
export const useModelConfig = createSingletonComposable(async () => {
  const { loadConfig } = await import('unconfig')
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

  return {
    readModelConfig,
    sendModelConfigToWebview,
  }
})
