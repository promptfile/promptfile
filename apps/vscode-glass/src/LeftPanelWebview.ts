import * as vscode from 'vscode'
import { EventEmitter, Uri, WebviewView, WebviewViewProvider, window } from 'vscode'
import { getDocumentFilename, getNonce } from './util/isGlassFile'

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
  }

  private activateMessageListener() {
    this._view.webview.onDidReceiveMessage(async (message: any) => {
      switch (message.action) {
        case 'onOpen':
          break
        case 'saveOpenaiKey':
          const newKey = message.data.key
          const config = vscode.workspace.getConfiguration('glass')
          await config.update('openaiKey', newKey, vscode.ConfigurationTarget.Global)
          this._view.webview.postMessage({
            action: 'setOpenaiKey',
            data: newKey,
          })
          break
        case 'getFilename':
          const editor = window.activeTextEditor
          if (editor) {
            this._view.webview.postMessage({
              action: 'setFilename',
              data: {
                filename: getDocumentFilename(editor.document),
              },
            })
          }
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

        default:
          break
      }
    })
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
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
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body, html {
                        margin: 0;
                        padding: 0;
                        height: 100vh;
                        overflow: hidden;
                    }
                    #root {
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 0;
                        overflow: hidden;
                    }
                </style>
              </head>
              <body>
                <div id="root"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
              </body>
          </html>`
  }
}
