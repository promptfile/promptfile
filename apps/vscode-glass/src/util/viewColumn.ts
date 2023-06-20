import * as vscode from 'vscode'
import { GlassPlayground } from './playground'

export const getCurrentViewColumn = (playgrounds: Map<string, GlassPlayground>) => {
  for (const playground of playgrounds.values()) {
    if (playground.panel.viewColumn) {
      return playground.panel.viewColumn
    }
  }
  return vscode.ViewColumn.Beside
}
