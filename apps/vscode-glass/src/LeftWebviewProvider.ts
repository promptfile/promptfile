import { parseGlassMetadata } from '@glass-lang/glassc'
import * as vscode from 'vscode'
import { EventEmitter, Uri, Webview, WebviewView, WebviewViewProvider, window } from 'vscode'
import { executeGlassFile } from './executeGlassFile'
import { getDocumentFilename, isGlassFile } from './util/isGlassFile'

function getNonce() {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

export class LeftPanelWebview implements WebviewViewProvider {
  constructor(public readonly extensionPath: Uri, public data: any, public _view: any = null) {}
  private onDidChangeTreeData: EventEmitter<any | undefined | null | void> = new EventEmitter<
    any | undefined | null | void
  >()

  refresh(context: any): void {
    this.onDidChangeTreeData.fire(null)
    this._view.webview.html = this._getHtmlForWebview(this._view?.webview)
  }

  //called when a view first becomes visible
  resolveWebviewView(webviewView: WebviewView): void | Thenable<void> {
    webviewView.webview.options = {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [this.extensionPath],
    } as any
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)
    this._view = webviewView
    this.activateMessageListener()

    // get the current file
    const currentEditor = window.activeTextEditor
    if (!currentEditor || !currentEditor.document.fileName.endsWith('.glass')) {
      return
    }

    const metadata = parseGlassMetadata(currentEditor.document.getText())
    webviewView.webview.postMessage({
      action: 'updateDocumentMetadata',
      data: {
        ...metadata,
        filename: getDocumentFilename(currentEditor.document),
      },
    })
  }

  private activateMessageListener() {
    this._view.webview.onDidReceiveMessage(async (message: any) => {
      switch (message.action) {
        case 'getOpenaiKey':
          this._view.webview.postMessage({
            action: 'setOpenaiKey',
            data: vscode.workspace.getConfiguration().get('glass.openaiKey'),
          })
          break

        case 'showMessage':
          const level = message.data.level
          const text = message.data.text
          if (level === 'error') {
            await window.showErrorMessage(text)
          } else if (level === 'warn') {
            await window.showWarningMessage(text)
          } else {
            await window.showInformationMessage(text)
          }
          break

        case 'execCurrentFile':
          const currentEditor = window.activeTextEditor
          if (!currentEditor) {
            window.showErrorMessage('No active editor')
            return
          }

          if (!isGlassFile(currentEditor.document)) {
            window.showErrorMessage('Current file is not a .glass file')
            return
          }

          const output = await executeGlassFile(currentEditor.document, message.data)

          this._view.webview.postMessage({
            action: 'execFileOutput',
            data: {
              prompt: output,
              args: message.data,
              file: getDocumentFilename(currentEditor.document),
            },
          })

          break
        default:
          break
      }
    })
  }

  private _getHtmlForWebview(webview: Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    // Script to handle user action
    // const scriptUri = webview.asWebviewUri(
    //   Uri.joinPath(this.extensionPath, 'script', 'left-webview-provider.js')
    // )
    const scriptUri = webview.asWebviewUri(Uri.joinPath(this.extensionPath, 'out', 'rig.js'))
    // const constantUri = webview.asWebviewUri(
    //   Uri.joinPath(this.extensionPath, 'script', 'constant.js')
    // )

    //vscode-icon file from codicon lib
    // const codiconsUri = webview.asWebviewUri(
    //   Uri.joinPath(this.extensionPath, 'script', 'codicon.css')
    // )

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce()

    return `<html>
                <head>
                    <meta charSet="utf-8"/>
                    <meta http-equiv="Content-Security-Policy"
                            content="default-src 'none';
                            img-src vscode-resource: https:;
                            font-src ${webview.cspSource};
                            style-src ${webview.cspSource} 'unsafe-inline';
                            connect-src https://api.openai.com;
                            script-src 'nonce-${nonce}'

							;">

                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body>
                  <div id="root"></div>
                  <script nonce="${nonce}" src="${scriptUri}"></script>
                </body>
            </html>`
  }
}
