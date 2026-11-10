---
id: BACK-802
title: 为决策添加创建入口并完善保存流程
status: Done
assignee:
  - '@codex'
created_date: '2026-11-10T12:59:00Z'
updated_date: '2026-11-10T13:06:00Z'
labels: []
dependencies: []
modified_files:
  - src/core/backlog.ts
  - src/server/index.ts
  - src/test/server-decision-sections.test.ts
  - src/web/components/DecisionDetail.tsx
  - src/web/components/SideNavigation.tsx
  - src/web/lib/api.ts
  - src/web/locales/zh-CN.json
type: feature
ordinal: 412000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
用户需要从面板直接创建项目决策。当前侧栏缺少可见入口，现有新建页面保存时只提交标题，需确保用户输入的正文也被保留。
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 侧栏决策区域提供可访问的新建入口，点击进入创建页面。
- [x] #2 填写标题和正文后保存成功，决策出现在列表并打开详情，刷新后内容仍保留。
- [x] #3 空白标题不能提交；取消不创建记录；保存失败时显示可见错误并保留输入以便重试。
- [x] #4 按改动范围完成类型检查、格式检查和相关测试，并验证创建入口与保存交互。
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
启用侧栏决策加号入口；新建表单使用背景、决策、影响三个现有字段，一次请求保存标题和正文，沿用默认 proposed 状态；补齐标题校验、失败提示和输入保留；用接口回读测试和浏览器交互验证入口、保存及取消。
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
已确认 groma 命令在当前环境不可用；本次使用现有 CLI、核心创建方法和页面组件，不修改 Groma 架构文件。
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
已增加侧栏决策创建入口，表单一次保存标题、背景、决策和影响。空标题禁用提交，取消不落盘，保存失败显示错误并保留输入；列表刷新不再清空新建草稿。验证：bun run check:types 通过；5 个 Biome 覆盖的变更文件检查通过，TSX 按现有配置不受 Biome 覆盖；相关三份测试 26 通过、1 跳过（平台符号链接测试），0 失败；生产构建通过。隔离浏览器实测入口、空标题、取消、断线失败后恢复重试、保存跳转和刷新回读均通过。DoD 文档专用项不适用，未运行全量测试。当前项目面板已更新至验证过的构建；尚未提交。
<!-- SECTION:FINAL_SUMMARY:END -->
