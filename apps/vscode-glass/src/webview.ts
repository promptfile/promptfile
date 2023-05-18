import { Uri, Webview } from 'vscode'
import { getNonce } from './util/isGlassFile'

export function getHtmlForWebview(webview: Webview, context: any) {
  // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
  // Script to handle user action
  // const scriptUri = webview.asWebviewUri(
  //   Uri.joinPath(this.extensionPath, 'script', 'left-webview-provider.js')
  // )
  const scriptUri = webview.asWebviewUri(Uri.joinPath(context.extensionPath, 'out', 'rig.js'))
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
