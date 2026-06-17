import * as vscode from 'vscode';
import { logToChannel } from '../utils';

export function setupHelloCommand() {
  const message = 'Hello from your VS Code extension template.';

  logToChannel(message);
  vscode.window.showInformationMessage(message);
}
