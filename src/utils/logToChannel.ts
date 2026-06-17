import * as vscode from 'vscode';

const logChannel = vscode.window.createOutputChannel('Extension Template');

export function logToChannel(message: string) {
  logChannel.appendLine(message);
}
