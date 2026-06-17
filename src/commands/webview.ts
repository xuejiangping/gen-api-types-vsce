import * as vscode from 'vscode';

let currentWebviewPanel: vscode.WebviewPanel | null = null;
const resourceRootPath = 'webview/dist';
const viewType = 'extensionTemplateWebview';

function getWebviewTitle() {
  return vscode.workspace
    .getConfiguration('extension-template')
    .get<string>('webviewTitle', 'Extension Template');
}

function createWebviewPanel(resourceRootUri: vscode.Uri) {
  return vscode.window.createWebviewPanel(
    viewType,
    getWebviewTitle(),
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      localResourceRoots: [resourceRootUri]
    }
  );
}

function replaceHtmlUri(htmlContent: string, panel: vscode.WebviewPanel, resourceRootUri: vscode.Uri) {
  return htmlContent.replace(
    /(src|href)="([^"]*)"/g,
    (_, attr, resourcePath) => {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(resourcePath)) {
        return attr + "=\"" + resourcePath + "\"";
      }

      const relativePath = resourcePath.replace(/^\.?\//, '');
      const resourceUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(resourceRootUri, relativePath));
      return attr + "=\"" + resourceUri + "\"";
    }
  );
}

function addContentSecurityPolicy(htmlContent: string, webview: vscode.Webview) {
  const csp = [
    "default-src 'none'",
    "img-src " + webview.cspSource + " https: data:",
    "style-src " + webview.cspSource + " 'unsafe-inline'",
    "script-src " + webview.cspSource
  ].join('; ');

  return htmlContent.replace(
    /<head>/i,
    "<head><meta http-equiv=\"Content-Security-Policy\" content=\"" + csp + "\">"
  );
}

function setupMessageListener(panel: vscode.WebviewPanel) {
  panel.webview.onDidReceiveMessage((message) => {
    if (message?.type === 'ready') {
      vscode.window.showInformationMessage('Webview is ready.');
    }
  });
}

export async function setupOpenWebviewCommand(context: vscode.ExtensionContext) {
  const resourceRootUri = vscode.Uri.joinPath(context.extensionUri, resourceRootPath);

  if (currentWebviewPanel) {
    currentWebviewPanel.reveal(vscode.ViewColumn.One);
    return;
  }

  currentWebviewPanel = createWebviewPanel(resourceRootUri);
  currentWebviewPanel.onDidDispose(() => {
    currentWebviewPanel = null;
  });
  setupMessageListener(currentWebviewPanel);

  const bytes = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(resourceRootUri, 'index.html'));
  const htmlContent = Buffer.from(bytes).toString('utf8');
  const htmlWithUris = replaceHtmlUri(htmlContent, currentWebviewPanel, resourceRootUri);
  currentWebviewPanel.webview.html = addContentSecurityPolicy(htmlWithUris, currentWebviewPanel.webview);
}
