# EasyBacklog

EasyBacklog 是一个本地任务管理工具，基于 Alex Gavrilescu 发起的 [Backlog.md](https://github.com/MrLesk/Backlog.md)。它沿用上游的 Markdown 任务格式、`backlog` 命令行和终端看板。你可以用命令行创建任务，在浏览器里查看或编辑同一条记录，也可以直接阅读项目中的任务文件。项目沿用 [MIT 许可证](LICENSE)。

当前 EasyBacklog 版本为 **1.0.0**。[项目仓库](https://github.com/DaSH233/EasyBacklog)

## 相对上游的主要改动

以下对照的是本仓库开发 EasyBacklog 时采用的 Backlog.md v1.55.3 基线。

| 改动 | 使用时能做什么 |
| --- | --- |
| Web 界面支持简体中文 | 在设置中切换 English 或简体中文，刷新后仍保留所选语言。切换只影响界面文字，任务正文和自定义状态保留原文。 |
| 统一归档页面 | 从侧栏进入「归档」，按任务、草稿、文档或里程碑分类搜索、预览和恢复。恢复保留原 ID，遇到冲突会提示；永久删除前可以核对所选记录。 |
| 任务与文档互相引用 | 在任务正文中写入 `doc-1` 或 `#doc-2`，Web 界面会链接到对应记录。在文档页也能看到哪些任务引用了它。 |
| 项目可控制 AI 自动管理任务 | 初始化时选择是否允许 AI 在开发过程中自动创建和更新任务。默认关闭时，仍可手动管理任务，也可明确要求 AI 操作指定任务。 |
| 提供 EasyBacklog Skill | 在 Codex 中调用 Skill 可以打开或复用当前项目的看板，并按项目设置和任务阶段读取相应指南。 |

## 决策记录迁移

独立的决策命令、页面和搜索类型已移除。单个任务的取舍可写入实施笔记；跨任务的长期约定使用普通文档，例如 `backlog doc create "技术选型" --path decisions --content "背景、选择和影响"`。

升级不会自动改写其他项目的旧决策文件。迁移时，使用 `doc create` 复制完整正文，并在正文中保留原 ID、日期和状态；将任务中的旧 ID、文件路径及 `/decisions/…` 链接更新为新文档引用。原记录已归档的，使用 `doc archive <新文档 ID>` 保持归档状态。核对内容与引用后，再处理旧文件。`decision` 前缀继续保留，避免旧 ID 被复用为任务。

完整步骤见 [CLI 迁移说明](CLI-INSTRUCTIONS.md#migrating-legacy-decision-records)。里程碑仍支持创建、分配、筛选、看板分组和归档。

## 使用方法

### 从源码构建 CLI

准备 Git、Bun 1.4.4 和 Node.js 26.12.1 或更高版本。以下步骤构建的是本仓库的 EasyBacklog，生成的命令名为 `backlog`。[开发环境说明](DEVELOPMENT.md)

```sh
git clone https://github.com/DaSH233/EasyBacklog.git
cd EasyBacklog
bun install --frozen-lockfile
bun run build
```

将生成的 `dist` 目录加入终端的 `PATH`，然后运行 `backlog --version`。Windows 的可执行文件是 `dist/backlog.exe`，macOS 和 Linux 上是 `dist/backlog`。如果只想查看本源码仓库的任务，可直接在仓库根目录运行 `bun run cli task list --plain`。

### 在独立目录创建第一条任务

在源码仓库之外新建一个空目录，进入该目录后依次执行：

```sh
backlog init "我的第一个项目" --defaults --no-git
backlog task create "整理安装步骤" --ac "新成员可以按文档启动看板" --plain
backlog task view TASK-1 --plain
```

第一条命令会创建本地 `backlog/` 目录；`--no-git` 适合独立试用。在空项目中，第二条命令会输出分配的 ID `TASK-1` 和任务文件路径。第三条命令按 ID 显示标题、状态及验收标准。在已有项目中，请使用创建命令实际返回的 ID。

### 查看和管理看板

在刚才的项目目录运行 `backlog browser`，打开输出的本地地址即可查看或编辑任务，按 Ctrl+C 停止服务。使用终端看板可运行 `backlog board`。

日常使用看板请运行构建后的 CLI：Windows 为 `./dist/backlog.exe browser`，macOS/Linux 为 `./dist/backlog browser`（在本仓库根目录执行）。构建产物会按需加载详情编辑器等前端资源；`bun run cli browser` 用于源码开发，目前仍会生成较大的单个 JavaScript 文件。

<a id="-configuration"></a>

### 配置项目和 AI 协作

运行 `backlog config` 打开项目配置向导，或用 `backlog config get automaticTaskManagement` 查看当前项目的自动任务管理设置。[配置参考](ADVANCED-CONFIG.md)

使用 Codex 时，可将仓库中的整个 [EasyBacklog Skill 目录](skills/easybacklog) 复制到目标项目的 `.agents/skills/easybacklog`，在新会话中输入 `$easybacklog`。目标项目需已初始化，并能在其目录运行上面构建的 `backlog` 命令。
