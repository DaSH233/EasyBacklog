---
id: BACK-804
title: 修复全量复查发现的既有测试失败
status: Done
assignee:
  - '@codex'
created_date: '2026-11-12T16:00:00Z'
updated_date: '2026-11-16T11:46:00Z'
labels: []
dependencies: []
references:
  - BACK-803
  - >-
    https://github.com/DaSH233/EasyBacklog/commit/2a39f90441b3d3bb2d66187816162f7163195df7
modified_files:
  - src/test/cli-draft-edit.test.ts
  - src/test/tui-draft-edit.test.ts
  - src/test/content-store.test.ts
  - src/test/web-language.test.tsx
  - src/test/web-in-place-refresh.test.tsx
  - src/test/test-utils.ts
  - src/test/cli-task-delete.test.ts
  - src/test/cli-task-restore.test.ts
type: bug
ordinal: 414000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
承接 BACK-803 三批优化复查后的 15 项基线失败。用户要求继续区分环境、测试和产品缺陷并修复，保留之前未提交改动，不提交。
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 15 项失败逐项明确原因；有效业务断言保留，实际缺陷有回归验证。
- [x] #2 可执行的受影响测试通过；权限受限场景明确跳过，具备能力的环境仍执行符号链接断言。
- [x] #3 重新执行类型、Biome、构建与全量测试，记录全部失败、跳过及环境限制，未提交。
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
1. 修正草稿健康列表旧断言和 Web 导航请求契约，补齐语言测试的浏览器 API 模拟。2. TUI 复用 Node 空编辑器；共享文件符号链接能力探测，仅跳过 Windows 明确权限拒绝。3. ContentStore 手动发布测试关闭真实 watcher，保留文件替换与身份冲突断言，重复运行验证稳定性。4. 运行定向、类型、Biome、构建和完整 CI 测试；10 秒超时失败隔离放宽复核，不改生产超时规则。

全量复验在本机使用 --timeout=60000：此前已确认的 Git 初始化/提交失败场景正常耗时约 11–13 秒，10 秒限制产生环境超时。保留 CI 配置和测试业务断言不变，报告时注明本次超时上限；以实际失败决定是否追加隔离验证。

组合复跑进一步复现 TUI 后的缓存监听失败：TUI 测试启用 Core watchers，却只删除临时目录。补上 teardown 的 disposeContentStore，复验同一 TUI+缓存组合，判断资源泄漏与失败的因果关系。
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
原因与修复：原 15 项为 9 项旧契约断言（Web 导航计数 8、草稿健康列表 1）、1 项缺失 matchMedia 的 DOM 模拟、4 项跨平台前提（true 命令 1、符号链接权限 3）、1 项真实 watcher 与手动事件混用的缓存夹具竞争。未发现需要修改产品逻辑的缺陷。保留 DOM 节点复用、增量请求、错误恢复、归档/恢复/删除和身份冲突断言；增加 search 与导航计数请求各一次的约束。符号链接仅在能力探测遇到 Windows EPERM 时跳过，其他错误仍抛出；顺手修正相对链接夹具用 '/' 分割 Windows 路径的问题。
定向验证：Web 15 pass；缓存原失败用例连续 100 pass。首次 6 文件非隔离组合 140 pass、5 skip、3 fail，又暴露 TUI 测试未释放 Core watchers 的资源泄漏；TUI+缓存复现组合 12 pass、2 fail，补上 disposeContentStore 后相同组合 14 pass，完整两个文件 79 pass、0 fail。单独与 CI 隔离模式的 ContentStore 均 68 pass。日志保留在 tmp/back-804/，没有删除失败证据。
类型检查、Biome 480 文件、正式构建、编译 CLI/Web/MCP 冒烟和 git diff --check 已通过。全量 CI 入口正在以本机 60 秒测试上限运行；仓库 CI 超时规则未修改。

最终验证完成：CI 全量入口 bun scripts/run-ci-tests.ts --profile=full --parallel=2 --isolate --timeout=60000 --max-concurrency=2，共 329 文件、3539 测试：3430 pass、109 skip、0 fail。非 DOM 3041 pass/109 skip/0 fail，Web 389 pass/0 fail。日志 tmp/back-804/full.log，结构化统计 full-summary.json。原 15 项中 12 项修复后通过，3 项经实际能力探测确认 Windows 符号链接 EPERM 而跳过；另外 106 项为原有跳过。此前 14 项慢速提交失败场景本轮均通过，60 秒仅为本机执行参数，仓库 CI 配置未变。
简化复核：只修改 8 个测试/辅助文件，符号链接探测共享一份实现，无生产代码、版本或兼容层改动。缓存夹具只保留显式发布事件来源，TUI teardown 复用现有 disposeContentStore。最后追加的清理通过完整 TUI+缓存组合 79 项，以及最终类型/Biome 检查。DoD#1 的仅文档变更条件不适用；本轮执行了完整代码检查。Node/Nix 既有版本限制不在这 15 项修复范围，未重复执行未变化的 Node 脚本。
全程未暂存、未提交；HEAD 保持 6efafd7c4a7565213072b38e1e6211654865b72a，原有 7 个无关文件哈希保持不变。
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
完成 15 项既有失败排查：修复旧断言、DOM 模拟、跨平台夹具和缓存事件竞争，并补齐 TUI 测试监听器清理。12 项修复后通过，3 项符号链接用例按实际 Windows 权限跳过，具备能力时仍执行；未发现需要改变生产逻辑的缺陷。全量 3430 pass/109 skip/0 fail（本机 60 秒上限）；类型、Biome、构建和编译冒烟通过。未暂存、未提交。
<!-- SECTION:FINAL_SUMMARY:END -->
