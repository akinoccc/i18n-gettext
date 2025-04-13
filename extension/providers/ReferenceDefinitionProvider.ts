import { useWorkspaceFolders } from 'reactive-vscode'
import * as vscode from 'vscode'
import { logger } from '../utils/logger'

// 文件引用定义提供者类
export class ReferenceDefinitionProvider implements vscode.DefinitionProvider {
  // 使用响应式API获取工作区文件夹
  private workspaceFolders = useWorkspaceFolders()

  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.ProviderResult<vscode.Definition> {
    const range = document.getWordRangeAtPosition(position, /['"]([^'"]*?):(\d+)['"]/g)

    if (!range)
      return null

    const text = document.getText(range)
    const match = text.match(/['"]([^'"]*?):(\d+)['"]/g)

    if (!match)
      return null

    // 从匹配的文本中提取文件路径和行号
    const refMatch = text.match(/['"]([^'"]*?):(\d+)['"]/g)?.[0]?.match(/['"](.+?):(\d+)['"]/)?.[0]

    if (!refMatch)
      return null

    const innerMatch = refMatch.match(/['"](.+?):(\d+)['"]/)
    if (!innerMatch || innerMatch.length < 3)
      return null

    const [, filePath, lineStr] = innerMatch
    const lineNumber = Number.parseInt(lineStr, 10)

    // 使用响应式API获取的工作区文件夹
    const folders = this.workspaceFolders.value || []
    if (folders.length === 0)
      return null

    // 遍历工作区文件夹，查找匹配的文件
    return folders.map((folder) => {
      try {
        const fullPath = vscode.Uri.joinPath(folder.uri, filePath)
        return new vscode.Location(
          fullPath,
          new vscode.Position(lineNumber - 1, 0),
        )
      }
      catch (error) {
        logger.error('解析引用路径时发生错误:', error)
        return null
      }
    }).filter(Boolean) as vscode.Location[] || null
  }
}
