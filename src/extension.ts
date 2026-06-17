import * as vscode from 'vscode';
import { setupHelloCommand, setupOpenWebviewCommand } from './commands/index';
import { getRegisterCommand } from './utils';

export function activate(context: vscode.ExtensionContext) {
  const registerCommand = getRegisterCommand(context);

  registerCommand('extension-template.hello', setupHelloCommand);
  registerCommand('extension-template.openWebview', setupOpenWebviewCommand);
}

export function deactivate() {
  console.log('Extension template deactivated');
}
