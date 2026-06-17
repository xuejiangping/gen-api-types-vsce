import * as vscode from 'vscode';
import { setupGenerateApiTypesCommand, setupHelloCommand, setupOpenWebviewCommand } from './commands/index';
import { getRegisterCommand } from './utils';

export function activate(context: vscode.ExtensionContext) {
  const registerCommand = getRegisterCommand(context);

  registerCommand('extension-template.hello', setupHelloCommand);
  registerCommand('extension-template.openWebview', setupOpenWebviewCommand);
  registerCommand('gen-api-types.generateApiTypes', setupGenerateApiTypesCommand);
}

export function deactivate() {
  console.log('Extension template deactivated');
}
