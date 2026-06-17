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

function getWorkspaceCliPath(projectRoot: string) {
  return path.join(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'gen-api-types.cmd' : 'gen-api-types');
}

function getOutputDir(config: GenApiTypesConfig, projectRoot: string, apiDir: string) {
  return resolvePathOption(config.outputDir, projectRoot) ?? apiDir;
}

function buildArgs(config: GenApiTypesConfig, projectRoot: string, apiDir: string) {
  const args: string[] = ['--project_root', projectRoot];

  if (config.outputFile) {
    args.push('--output_file', config.outputFile);
  }

  args.push('--output_dir', getOutputDir(config, projectRoot, apiDir));

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

function getOutputTarget(config: GenApiTypesConfig, projectRoot: string, apiDir: string) {
  const outputDir = getOutputDir(config, projectRoot, apiDir);
  const outputFile = config.outputFile || 'api-types.d.ts';

  return path.resolve(outputDir, outputFile);
}

async function confirmOverwrite(outputTarget: string) {
  if (!fs.existsSync(outputTarget)) {
    return true;
  }

  const relativePath = vscode.workspace.asRelativePath(outputTarget, false);
  const action = await vscode.window.showWarningMessage(
    `类型文件已存在，继续生成会覆盖：${relativePath}`,
    { modal: true },
    '覆盖生成'
  );

  return action === '覆盖生成';
}

function runCli(cliPath: string, args: string[], cwd: string) {
  return new Promise<void>((resolve, reject) => {
    outputChannel.appendLine(`> ${cliPath} ${args.map(arg => JSON.stringify(arg)).join(' ')}`);
    outputChannel.appendLine(`cwd: ${cwd}`);

    const child = cp.spawn(cliPath, args, {
      cwd,
      env: process.env
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

export async function setupGenerateApiTypesCommand(_context: vscode.ExtensionContext, uri?: vscode.Uri) {
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
  const cliPath = getWorkspaceCliPath(projectRoot);
  const outputTarget = getOutputTarget(config, projectRoot, apiDir);

  if (!fs.existsSync(cliPath)) {
    vscode.window.showErrorMessage(`当前项目未安装 gen-api-types，请先在项目根目录安装后再使用。`);
    outputChannel.appendLine(`未找到业务项目 CLI：${cliPath}`);
    return;
  }

  if (!await confirmOverwrite(outputTarget)) {
    return;
  }

  outputChannel.clear();
  outputChannel.show(true);

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: '正在生成 API 返回类型...',
        cancellable: false
      },
      () => runCli(cliPath, buildArgs(config, projectRoot, apiDir), projectRoot)
    );
    vscode.window.showInformationMessage('API 返回类型生成完成。');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel.appendLine(`\n${message}`);
    vscode.window.showErrorMessage(`API 返回类型生成失败：${message}`);
  }
}
