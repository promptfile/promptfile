import { Uri, Webview } from 'vscode'

export function getHtmlForWebview(webview: Webview, extensionPath: Uri) {
  function getNonce() {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  }
  // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
  // Script to handle user action
  // const scriptUri = webview.asWebviewUri(
  //   Uri.joinPath(this.extensionPath, 'script', 'left-webview-provider.js')
  // )
  const scriptUri = webview.asWebviewUri(Uri.joinPath(extensionPath, 'out', 'rig.js'))
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
