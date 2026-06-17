# Gen API Types VS Code

`gen-api-types-vsce` 是 [gen-api-types](https://github.com/xuejiangping/gen-api-types) 的 VS Code 辅助插件。

它不内置 CLI，也不替代 `gen-api-types` 本身；插件的主要作用是把原本需要手写的命令参数整理成 VS Code 右键操作，方便在业务项目中快速生成 API 返回类型。
![img](docs/images/image.png)

## 功能

- 在 `.ts` / `.tsx` 文件编辑器右键菜单中提供 `生成 API 返回类型(gen-api-types)`。
- 在资源管理器中右键 `.ts` / `.tsx` 文件也可以执行生成。
- 自动把当前 TypeScript 文件所在目录作为 `gen-api-types` 的 `api_dirs` 参数。
- 默认把类型文件生成到当前 TypeScript 文件同目录。
- 支持配置 `project_root`、`output_file`、`output_dir`、`ts_config_path`、`isExported`。
- 输出文件已存在时会弹出覆盖确认，避免误删已有类型文件。
- 执行日志会输出到 VS Code 的 `Gen API Types` Output Channel。

## 前置条件

业务项目需要先安装 `gen-api-types`：

```bash
npm install gen-api-types -D
```

或：

```bash
pnpm add gen-api-types -D
```

插件会调用业务项目中的本地 CLI：

```text
node_modules/.bin/gen-api-types
```

如果业务项目没有安装 `gen-api-types`，插件会提示先安装后再使用。

## 使用方式

1. 在业务项目中按 `gen-api-types` 文档给 API 类和静态方法添加装饰器：

```ts
import { gen_type_c, gen_type_m } from 'gen-api-types'

@gen_type_c()
export class UserApi {
	@gen_type_m({ args: [1], typeName: 'Response_UserApi_getUser' })
	static async getUser(id: number): Promise<Response_UserApi_getUser> {
		return fetch(`/api/user/${id}`).then(res => res.json())
	}
}
```

2. 在 VS Code 中打开这个 `.ts` / `.tsx` 文件。
3. 右键选择 `生成 API 返回类型(gen-api-types)`。
4. 如果目标类型文件已存在，确认是否覆盖。
5. 生成完成后，在当前 TS 文件同目录查看 `api-types.d.ts`。

插件最终执行的命令形态类似：

```bash
gen-api-types \
  --project_root <workspace-root> \
  --output_dir <current-ts-file-dir> \
  --output_file api-types.d.ts \
  <current-ts-file-dir>
```

## 配置项

可以在 VS Code `settings.json` 中配置：

```json
{
	"gen-api-types.projectRoot": "",
	"gen-api-types.outputFile": "api-types.d.ts",
	"gen-api-types.outputDir": "",
	"gen-api-types.tsConfigPath": "",
	"gen-api-types.isExported": false
}
```

| 配置项                       | 对应 CLI 参数          | 默认行为                          |
| ---------------------------- | ---------------------- | --------------------------------- |
| `gen-api-types.projectRoot`  | `-r, --project_root`   | 当前 TS 文件所在 workspace 根目录 |
| `gen-api-types.outputFile`   | `-O, --output_file`    | `api-types.d.ts`                  |
| `gen-api-types.outputDir`    | `-o, --output_dir`     | 当前 TS 文件所在目录              |
| `gen-api-types.tsConfigPath` | `-t, --ts_config_path` | 不传，由 CLI 使用自身默认值       |
| `gen-api-types.isExported`   | `--isExported`         | `false`                           |

相对路径会基于 `projectRoot` 解析。

## 生成和覆盖规则

当前 `gen-api-types` CLI 会覆盖输出文件。插件在调用 CLI 前会先检查目标文件：

- 文件不存在：直接生成。
- 文件已存在：弹出确认框，只有选择 `覆盖生成` 才会继续。

默认输出目标是：

```text
当前 TS 文件所在目录/api-types.d.ts
```

如果配置了 `gen-api-types.outputDir` 或 `gen-api-types.outputFile`，则按配置计算目标文件。

## 与 gen-api-types 的关系

本仓库只提供 VS Code 交互能力：

- 贡献右键菜单。
- 读取 VS Code 配置。
- 计算 CLI 参数。
- 调用业务项目本地安装的 `gen-api-types`。
- 展示执行进度、日志和错误提示。

类型分析、接口执行、类型文件生成逻辑都由 [`gen-api-types`](https://github.com/xuejiangping/gen-api-types) 完成。

## 开发

```bash
pnpm install
pnpm -C webview install
pnpm run compile
```

在 VS Code 中按 `F5` 启动 Extension Development Host。

常用脚本：

- `pnpm run compile`: 构建 webview 和插件侧代码。
- `pnpm run watch`: 监听插件侧 TypeScript。
- `pnpm run webview:build`: 构建 webview 到 `webview/dist`。
- `pnpm run compile-tests`: TypeScript 类型检查。
- `pnpm run lint`: ESLint 检查。
- `pnpm run build`: 生成 VSIX 到 `release/gen-api-types-vsce.vsix`。

## 注意事项

- 业务项目需要启用装饰器能力，通常需要在 `tsconfig.json` 中配置 `experimentalDecorators: true`。
- 被生成类型的 API 方法需要符合 `gen-api-types` 的使用约定：接口类 + 静态 API 方法 + 装饰器标记。
- 插件不会联网安装 CLI；请在业务项目中显式安装 `gen-api-types`。
- 插件当前不会合并已有类型文件内容，只在执行前做覆盖确认。
