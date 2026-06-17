import * as cp from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';

const commandName = 'gen-api-types';
const outputChannel = vscode.window.createOutputChannel('Gen API Types');

type GenApiTypesConfig = {
  projectRoot?: string;
  outputFile?: string;
  outputDir?: string;
  tsConfigPath?: string;
  isExported?: boolean;
};

type CliCommand = {
  command: string;
  prefixArgs: string[];
  env?: NodeJS.ProcessEnv;
};

function resolvePathOption(value: string | undefined, baseDir: string) {
  if (!value) {
    return undefined;
  }

  return path.isAbsolute(value) ? value : path.resolve(baseDir, value);
}

function getTargetUri(uri?: vscode.Uri) {
  return uri ?? vscode.window.activeTextEditor?.document.uri;
}

function getWorkspaceRoot(targetUri: vscode.Uri) {
  return vscode.workspace.getWorkspaceFolder(targetUri)?.uri.fsPath ?? path.dirname(targetUri.fsPath);
}

function getCliPath(context: vscode.ExtensionContext) {
  return path.join(context.extensionPath, 'node_modules', 'gen-api-types', 'bin', 'index.js');
}

function getWorkspaceCliPath(projectRoot: string) {
  return path.join(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'gen-api-types.cmd' : 'gen-api-types');
}

function getNpxCommand() {
  return process.platform === 'win32' ? 'npx.cmd' : 'npx';
}

function getCliCommand(context: vscode.ExtensionContext, projectRoot: string): CliCommand {
  const workspaceCliPath = getWorkspaceCliPath(projectRoot);
  if (fs.existsSync(workspaceCliPath)) {
    return { command: workspaceCliPath, prefixArgs: [] };
  }

  const extensionCliPath = getCliPath(context);
  if (fs.existsSync(extensionCliPath)) {
    return {
      command: process.execPath,
      prefixArgs: [extensionCliPath],
      env: {
        ELECTRON_RUN_AS_NODE: '1'
      }
    };
  }

  return {
    command: getNpxCommand(),
    prefixArgs: ['--yes', 'gen-api-types@^1.0.13']
  };
}

function buildArgs(config: GenApiTypesConfig, projectRoot: string, apiDir: string) {
  const args: string[] = ['--project_root', projectRoot];

  if (config.outputFile) {
    args.push('--output_file', config.outputFile);
  }

  const outputDir = resolvePathOption(config.outputDir, projectRoot);
  if (outputDir) {
    args.push('--output_dir', outputDir);
  }

  const tsConfigPath = resolvePathOption(config.tsConfigPath, projectRoot);
  if (tsConfigPath) {
    args.push('--ts_config_path', tsConfigPath);
  }

  if (config.isExported) {
    args.push('--isExported');
  }

  args.push(apiDir);
  return args;
}

function runCli(cliCommand: CliCommand, args: string[], cwd: string) {
  return new Promise<void>((resolve, reject) => {
    const fullArgs = [...cliCommand.prefixArgs, ...args];
    outputChannel.appendLine(`> ${cliCommand.command} ${fullArgs.map(arg => JSON.stringify(arg)).join(' ')}`);
    outputChannel.appendLine(`cwd: ${cwd}`);

    const child = cp.spawn(cliCommand.command, fullArgs, {
      cwd,
      env: {
        ...process.env,
        ...cliCommand.env
      }
    });

    child.stdout?.on('data', data => outputChannel.append(data.toString()));
    child.stderr?.on('data', data => outputChannel.append(data.toString()));
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${commandName} exited with code ${code ?? 'unknown'}`));
    });
  });
}

export async function setupGenerateApiTypesCommand(context: vscode.ExtensionContext, uri?: vscode.Uri) {
  const targetUri = getTargetUri(uri);

  if (!targetUri || targetUri.scheme !== 'file') {
    vscode.window.showWarningMessage('请在一个 TypeScript 文件中执行生成 API 返回类型。');
    return;
  }

  if (!/\.(ts|tsx)$/i.test(targetUri.fsPath) || /\.d\.ts$/i.test(targetUri.fsPath)) {
    vscode.window.showWarningMessage('生成 API 返回类型仅支持 .ts 或 .tsx 源文件。');
    return;
  }

  const workspaceRoot = getWorkspaceRoot(targetUri);
  const configuration = vscode.workspace.getConfiguration(commandName);
  const config: GenApiTypesConfig = {
    projectRoot: configuration.get('projectRoot'),
    outputFile: configuration.get('outputFile'),
    outputDir: configuration.get('outputDir'),
    tsConfigPath: configuration.get('tsConfigPath'),
    isExported: configuration.get('isExported')
  };
  const projectRoot = resolvePathOption(config.projectRoot, workspaceRoot) ?? workspaceRoot;
  const apiDir = path.dirname(targetUri.fsPath);
  const cliCommand = getCliCommand(context, projectRoot);

  outputChannel.clear();
  outputChannel.show(true);

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: '正在生成 API 返回类型...',
        cancellable: false
      },
      () => runCli(cliCommand, buildArgs(config, projectRoot, apiDir), projectRoot)
    );
    vscode.window.showInformationMessage('API 返回类型生成完成。');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel.appendLine(`\n${message}`);
    vscode.window.showErrorMessage(`API 返回类型生成失败：${message}`);
  }
}
