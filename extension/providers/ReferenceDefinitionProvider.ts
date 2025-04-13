import * as vscode from 'vscode'
import { logger } from '../utils/logger'

// 文件引用定义提供者类
export class ReferenceDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.Definition> {
    const line = document.lineAt(position).text
    const range = document.getWordRangeAtPosition(position, /['"]([^'"]*?):(\d+)['"]/g)

    if (!range)
      return null

    const text = document.getText(range)
    const match = text.match(/['"]([^'"]*?):(\d+)['"]/g)

    if (!match)
      return null

    // 从匹配的文本中提取文件路径和行号
    const refMatch = text.match(/['"]([^'"]*?):(\d+)['"]/)?.[0]?.match(/['"](.+?):(\d+)['"]/)?.[0]

    if (!refMatch)
      return null

    const innerMatch = refMatch.match(/['"](.+?):(\d+)['"]/)
    if (!innerMatch || innerMatch.length < 3)
      return null

    const [, filePath, lineStr] = innerMatch
    const lineNumber = Number.parseInt(lineStr, 10)

    // 遍历工作区文件夹，查找匹配的文件
    return vscode.workspace.workspaceFolders?.map((folder) => {
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
