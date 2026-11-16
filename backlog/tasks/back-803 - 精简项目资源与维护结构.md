---
id: BACK-803
title: 精简项目资源与维护结构
status: Done
assignee:
  - '@codex'
created_date: '2026-11-12T09:16:00Z'
updated_date: '2026-11-12T11:52:00Z'
labels: []
dependencies: []
modified_files:
  - .github/5-minute-tour-256.png
  - .github/backlog-logo.png
  - .github/backlog-v1.40.gif
  - .github/backlog.jpg
  - .github/backlog.mp4
  - .github/cli-reference-256.png
  - .github/configuration-256.png
  - .github/favicon.png
  - .github/groma-map-dark.webp
  - .github/groma-map-light.webp
  - .github/sharing-export-256.png
  - .github/web-interface-256.png
  - .github/web.jpeg
  - .github/video-presentation.md
  - .claude/skills
  - package.json
  - bun.lock
  - DEVELOPMENT.md
  - CLI-INSTRUCTIONS.md
  - .github/copilot-instructions.md
  - .claude/agents/project-manager-backlog.md
  - src/mcp/README.md
  - bun.nix
  - src/test/cli-doc-archive.test.ts
  - src/test/cli-doc-restore-delete.test.ts
  - src/test/cli-guidance.test.ts
  - src/test/task-type-filtering.test.ts
  - src/commands/completion.ts
  - src/types/completions.d.ts
  - src/commands/completion.test.ts
  - src/core/milestones.ts
  - src/core/milestone-operations.ts
  - src/mcp/errors/mcp-errors.ts
  - src/mcp/tools/milestones/handlers.ts
  - src/mcp/tools/milestones/index.ts
  - src/mcp/utils/milestone-resolution.ts
  - src/cli.ts
  - src/server/index.ts
  - src/web/App.tsx
  - src/web/lib/lanes.ts
  - src/web/components/Board.tsx
  - src/web/components/TaskList.tsx
  - src/web/components/MilestonesPage.tsx
  - src/core/milestones.test.ts
  - src/web/utils/milestones.test.ts
  - src/web/utils/milestones.ts
  - src/web/utils/task-table.ts
  - src/completions/helper.test.ts
  - src/file-system/operations.ts
  - src/mcp/tools/documents/handlers.ts
  - src/core/backlog.ts
  - src/types/index.ts
  - src/test/commit-failure-after-change.test.ts
  - src/test/decision-removal.test.ts
  - src/test/document-archive.test.ts
  - src/test/server-document-archive.test.ts
type: chore
ordinal: 413000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
项目文件审查发现旧宣传资源、失效工具链接、过时说明、冗余直接依赖，以及补全和里程碑重复实现、决策功能移除后的单类型抽象。按三批减少维护成本：资源/链接/文档/依赖清理，Shell 补全和里程碑逻辑统一，document 生命周期抽象收缩。保留 CLI、TUI、Web 与可选 MCP 的现有公开行为，尤其是归档、恢复和失败语义；暂不提交。
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 第一批：移除确认无仓库引用的旧资源与失效链接，保留仍被构建使用的资源和项目历史。
- [x] #2 第一批：开发说明、CLI 文档和 Agent/MCP 说明与当前命令及目录一致。
- [x] #3 第一批：删除确认冗余的直接依赖，相关锁文件保持一致。
- [x] #4 第一批：完成相关测试、类型检查、格式检查和构建，记录既有失败及未验证限制。
- [x] #5 后续批次：Shell 补全脚本采用单一来源，开发与编译产物行为一致。
- [x] #6 后续批次：里程碑业务集中于共享模型，各界面不再通过 MCP 协议结果复用业务。
- [x] #7 后续批次：收缩仅用于 document 的通用内容记录抽象，保持归档恢复及失败语义。
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 仅修改文档时核对变更内容及涉及的链接和示例，跳过代码检查和测试。
- [x] #2 改动 TypeScript 源码、类型声明或类型检查配置时，通过 bun run check:types。
- [x] #3 改动 Biome 覆盖的文件时，对变更文件运行 bunx biome check；改动 Biome 规则时运行 bun run check。
- [x] #4 改动代码行为或测试时，通过受影响的测试；跨模块且影响范围难以界定时，通过 bun run test 全量测试。
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
本轮：1. 核对旧媒体与链接的完整引用，保留 Backlog 历史和本地验证证据。2. 清理已确认的旧媒体和失效链接，纠正文档与 Claude 模板中的旧命令。3. 移除 install 和旧路由类型声明，核对 Markdown 预览直接依赖必要性，同步 Bun/Nix 锁文件。4. 运行检查和构建，记录本轮结果及后续未完成范围，不提交。

第二批（用户已授权，暂不提交）：
1. 将四种 Shell 补全脚本作为文本静态导入，删除开发文件/编译内嵌两套来源；验证源码安装和独立编译产物安装内容一致。
2. 将里程碑变更业务与错误类型移到 core，CLI、HTTP 和 MCP 共用；MCP 仅转换协议响应，保留原有错误码、任务重分配、回滚与提交语义。
3. 合并 MCP 的别名解析到 core，Web 复用已有核心别名映射，移除纯转发模块；保持归档、同名与数字 ID 的现有优先级。
4. 运行补全、里程碑 CLI/MCP/HTTP/Web 相关测试、类型检查、Biome、构建与编译产物验证。记录结果，检查 AC5/6；AC7 留待后续批次，不提交。

第三批（用户已授权，暂不提交）：
1. 将只支持 document 的 ContentRecordKind/ContentRecord 及生命周期 API 收缩为 Document 和 archiveDocument/restoreDocument/deleteDocument，删除类型分发表、存储适配器和 find/leftFolder/reachedFolder 回调层。
2. 保留 archive/restore 共用的一次文件移动实现，以及现有校验、路径/ID 防护、引用收集、缓存更新、Git 提交的执行顺序；错误消息、HTTP/MCP 状态和已移动标记保持一致。
3. 同步 CLI、HTTP、MCP 和测试中的内部调用；保留失败场景断言。运行 document 生命周期、CLI/MCP/HTTP、搜索缓存与相关 Web 回归，检查类型、Biome、构建和编译冒烟。专门验证提交失败场景，既有环境问题与跳过项如实记录，不提交。

整体复查：按 CI 全量入口执行全部 Bun 测试并补跑 Node 脚本测试；对失败项比对 HEAD 和第一批基线，区分新增回归、既有失败和平台超时。复查发现样式直接导入 @uiw/react-markdown-preview，先复现 CI isolated linker 下的缺失依赖，再恢复直接声明，验证安装、构建及相关测试。暂不提交。
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
第一批已完成，分支 codex/back-803-project-cleanup；未提交，保留会话开始前的 6 个已修改文件及 .codex/config.toml。
- 清理：删除 13 个无仓库引用的旧媒体（约 5.47 MiB）、旧视频入口和失效 .claude/skills 链接；保留 Web 实际图标、Backlog 历史副本和已有本地验证材料。更新开发/MCP/Copilot/Claude 文档，合并 CLI 文档章节，并同步 4 个过时文档测试的指南位置或示例。
- 依赖：移除 install、@types/react-router-dom 和重复的 @uiw/react-markdown-preview 直接声明；预览依赖仍由编辑器提供。Bun 1.4.4 冻结安装成功；Bun/Nix 锁文件仅移除 4 个失去引用的包，其余版本与元数据不变。Nix 的 550 个唯一包名和哈希与 Bun 锁逐项一致；本机 Node 24.22.1 不满足更新器要求的 26.12.1，未运行 Nix 生成器或 Nix 构建，未绕过版本保护。
- 通过：bun run check:types、bun run check（480 文件）、bun run build、编译产物 smoke-compiled-build、git diff --check、16 个本地文档链接核对；Agent 安装、Markdown 预览和记录链接测试通过。文档归档/恢复两项定向检查、CLI 指南 17 项和任务类型 7 项修正后通过。各日志位于 tmp/back-803/。
- 全量：原始 bun run test 发现 Node 专用脚本在 Bun 下运行的问题后中断，改用 CI 的预打包 CLI + run-ci-tests.ts --profile=full --parallel=2 --isolate --timeout=10000 --max-concurrency=2，完成 329 个测试文件：3384 pass、106 skip、39 fail（ci-full.log）。其中 11 项经文档测试修正、当前进程加入 Git Shell 路径或隔离重跑后通过。剩余涉及草稿/YAML/符号链接 5 项、Web 9 项及提交失败场景初始化超时 14 项；前两组全部在清理前 HEAD 6efafd7c4a7565213072b38e1e6211654865b72a 快照复现，提交初始化超时另用其中 1 项在同一基线复现。未修改这些业务行为。Node 入口的 CI 证书测试 3 项通过；Nix 脚本测试仍受本机 Node 版本限制。
后续补全单一来源、里程碑共享业务和 document 抽象收缩尚未实施；整体任务保持 In Progress。

用户已明确授权第二批：统一 Shell 补全来源，整理里程碑共享逻辑；本批继续保持未提交。

第二批已完成（未提交）：
- Shell 补全统一为 completions/ 下四份脚本的文本静态导入，删除开发读取与编译内嵌副本；新增四种 Shell 源文件一致性测试及独立可执行文件在源码目录之外安装的回归测试。
- 里程碑变更迁至 src/core/milestone-operations.ts，CLI/HTTP 直接使用核心结果，MCP 仅格式化响应和转换领域错误。保留已有错误码、自动提交、重分配与回滚语义。
- 别名解析集中到 src/core/milestones.ts；App、Board、TaskList 和泳道复用共享映射。删除 MCP 专属解析文件和 Web 纯转发模块，核心测试迁至 src/core；更新 MCP 目录说明。
- 简化复核：删除三个只转发文件读取的私有方法，无新增兼容层。原有无关工作区改动保持原样。
验证：143 项非 DOM 相关测试 + 97 项 Web 交互测试通过，共 240 项、0 失败；check:types、Biome（480 文件）、正式 build、编译产物 CLI/Web/MCP 冒烟、git diff --check 均通过。日志在 tmp/back-803/batch2-*.log。本批按明确影响范围验证，没有重跑全量；第一批已记录的全量基线失败与 Nix 环境限制仍保留。
AC5、AC6 完成；AC7 的 document 通用抽象整理留待下一批。整体任务继续 In Progress，不创建提交。

第三批已完成（未提交）：
- 删除只有 document 一个使用者的 ContentRecordKind/ContentRecord、词汇分发表、存储适配器和生命周期回调层，改为 Document 专用 API；保留真正由任务和文档共享的拒绝/提交失败错误，保留 archive/restore 共用的文件移动实现。本批生产源码净减少 140 行。
- CLI、HTTP、MCP 及内部测试调用已同步。校验/引用读取在文件变更前，内容缓存更新在移动后、提交前；路径、ID、原始字节、归档只读及失败后的已移动状态保持原样。补充 5 项文件/缓存失败边界测试及 CLI 提交失败后的文档状态断言。
- 验证：23 个相关文件首轮 385 pass、34 skip、1 fail（10 秒超时连带 1 error）；该 MCP 自动提交场景以 60 秒超时隔离重跑通过。Web 31 pass；真实 Git 提交失败场景 14 pass（60 秒超时，单项约 12 秒，重构前同场景也需要超过 10 秒）。合计 431 个不同测试通过、34 个按既有 Windows 平台条件跳过。日志：tmp/back-803/batch3-tests.log、batch3-mcp-commit-recheck.log、batch3-web-tests.log、batch3-commit-failure.log。
- check:types、Biome（480 文件）、build、CLI/Web/MCP 编译冒烟、独立二进制文档归档/只读/恢复/删除与字节/嵌套路径检查、git diff --check 均通过。临时烟测脚本修正了 doc view 未找到时退出码的错误假设，产品原有行为未改。7 个原有无关文件（含 .codex/config.toml）哈希不变；暂存区为空，HEAD 未变。本批影响范围明确，未重跑全量；第一批记录的全量基线失败和 Nix 环境限制不在本轮修复范围。
AC7 完成，三批授权范围全部完成。DoD#1 的仅文档变更分支不适用；第一批文档核对已有记录。DoD#2/#3/#4 已完成对应检查。按用户要求保留本地未提交改动。

三批整体复查完成（未提交）：
- 更正第一批依赖结论：src/web/styles/source.css 直接导入 @uiw/react-markdown-preview/markdown.css，不能依赖编辑器传递提供。使用 CI 的 --frozen-lockfile --linker=isolated 在临时副本成功复现缺包构建失败；恢复 package.json 和 bun.lock 的 5.2.1 直接声明后，冻结隔离安装、CSS 构建、完整二进制构建及 CLI/Web/MCP 冒烟全部通过。此为本次发现并修复的新增回归；没有升级版本或增加兼容层。
- 全量采用 CI 的预打包 CLI 与 run-ci-tests.ts --profile=full --parallel=2 --isolate --timeout=10000 --max-concurrency=2：329 文件、3539 测试，3402 pass、106 skip、31 fail，日志 tmp/back-803/review-full.log 和 review-full-summary.json。未宣称全量全绿。
- 31 项失败中，原子编辑 1 项、文档 MCP 自动提交 1 项、提交失败场景 14 项在隔离/60 秒超时复验中全部通过（3 文件共 40 pass、0 fail；review-slow-rechecks.log）。余下草稿/YAML/符号链接 5 项和 Web 9 项与第一批已在清理前 HEAD 复现的基线一致。新出现的 ContentStore 文件替换 EPERM 在本次 HEAD 副本 20 次复跑中也复现 2 次，当前工作树复现 9 次；属于未改动路径上的既有 Windows 偶发问题，不能把频次当作性能或概率结论（review-content-store-head.log/current.log）。未发现其他由三批改动引入的回归。
- 里程碑四处旧别名实现与共享实现的 80,000 组对照一致，六个迁移的变更/回滚方法经规范化比较一致；文档生命周期复核未发现校验、文件变更、缓存发布及提交顺序变化。check:types、Biome 480 文件及 git diff --check 通过。Node 专用脚本 4 pass、3 fail，3 项均被既有 Node >=26.12.1 保护阻止（本机 24.22.1），未绕过保护，未验证 Nix 生成/构建。
- 详细证据均在 tmp/back-803/review-*.log；7 个原有无关文件哈希不变，暂存区为空，HEAD 仍为 6efafd7c4a7565213072b38e1e6211654865b72a。
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
三批精简完成，减少旧资源和重复实现；补全采用单一来源，里程碑业务归入共享核心，文档生命周期收缩为专用接口，保留公开行为与失败语义。相关回归、类型、格式、构建和编译烟测通过，平台跳过、超时复验及既有全量/Nix 限制详见实施记录。改动均未暂存、未提交。

整体复查补充：发现并修复第一批误删 Markdown 预览直接依赖造成的 CI 隔离构建回归。全量 3402 pass / 106 skip / 31 fail；其中 16 项经隔离或放宽超时复验通过，其余 15 项有清理前 HEAD 复现证据。未发现其他新增回归。类型、Biome、隔离构建和编译冒烟通过；Node/Nix 环境限制保留。所有改动未暂存、未提交。
<!-- SECTION:FINAL_SUMMARY:END -->
