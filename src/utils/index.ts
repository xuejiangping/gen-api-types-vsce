import * as vscode from 'vscode';
import { logToChannel } from './logToChannel';
export * from './logToChannel';

export function alertTip(type: 'success' | 'error', title: string, msg: string) {
  const alertFn = type === 'success' ? vscode.window.showInformationMessage : vscode.window.showErrorMessage;
  logToChannel(`${title}\r\n${msg}`);
  alertFn(title, '查看详情').then(action => {
    if (action === '查看详情') {
      vscode.window.showInformationMessage(msg);
    }
  });
}

export function getRegisterCommand(context: vscode.ExtensionContext) {
  return function <T extends unknown[], R>(cmd: string, cb: (context: vscode.ExtensionContext, ...args: T) => R | Promise<R>) {
    const disposable = vscode.commands.registerCommand(cmd, (...args: T) => cb(context, ...args));
    context.subscriptions.push(disposable);
  };
}
