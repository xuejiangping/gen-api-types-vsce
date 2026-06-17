# VS Code Extension Webview Template

一个保留 `Vue + Vite` webview 的 VS Code 插件开发模版。适合下次开发插件时直接复制/创建仓库，然后替换插件名称、命令和业务逻辑。

## 目录结构

```text
.
├── src
│   ├── commands
│   │   ├── hello.ts        # 普通命令示例
│   │   └── webview.ts      # webview 面板创建与资源加载
│   ├── extension.ts        # 插件激活入口
│   └── utils               # 通用工具
├── webview
│   ├── src                 # Vue webview 源码
│   └── dist                # webview 构建产物，打包插件时需要
├── package.json            # 插件清单与命令贡献
└── webpack.config.js       # 插件侧 TypeScript 打包
```

## 快速开始

```bash
pnpm install
pnpm -C webview install
pnpm run compile
```

在 VS Code 中按 `F5` 启动 Extension Development Host，然后通过命令面板执行：

- `Extension Template: Hello`
- `Extension Template: Open Webview`

## 常用脚本

- `pnpm run compile`: 构建 webview 和插件侧代码
- `pnpm run watch`: 监听插件侧 TypeScript
- `pnpm run webview:dev`: 启动 webview 的 Vite 开发服务
- `pnpm run webview:build`: 构建 webview 到 `webview/dist`
- `pnpm run build`: 生成 `.vsix`

## 改成你的插件

1. 修改 `package.json` 中的 `name`、`displayName`、`description`、`publisher`、`repository`。
2. 将命令 ID 前缀 `extension-template` 替换为你的插件前缀。
3. 在 `src/commands` 中新增业务命令，并在 `src/extension.ts` 注册。
4. 在 `webview/src` 中开发你的 Vue 页面。
5. 发布前执行 `pnpm run compile` 或 `pnpm run build`，确保 `webview/dist` 已生成。

## Webview 说明

`src/commands/webview.ts` 保留了 webview 模板中最常用的几件事：

- 创建并复用 `WebviewPanel`
- 将 `webview/dist/index.html` 中的相对资源路径替换为 VS Code webview URI
- 配置基础 CSP
- 通过 `postMessage` 和 `onDidReceiveMessage` 演示 webview 与插件侧通信

如果你不需要示例命令，可以删除 `hello.ts` 和 `extension-template.hello` 贡献项。
