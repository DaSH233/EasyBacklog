---
id: BACK-796
title: 分发 EasyBacklog Skill 并同步任务复用规则
status: Done
assignee:
  - '@Codex'
created_date: '2026-10-30T05:40:00Z'
updated_date: '2026-11-10T12:29:00Z'
labels: []
dependencies: []
references:
  - >-
    https://github.com/DaSH233/EasyBacklog/commit/94f70c81fd979129aaaaa0131eedcd67ac3352cd
  - >-
    https://github.com/DaSH233/EasyBacklog/commit/46716fbdd6ffc1b78cb5db3fe61396850cd39c73
ordinal: 406000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
让下载仓库的用户可安装 Skill，并同步 CLI 与 MCP 中的小修复重开、新需求新建规则。
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 CLI 与 MCP 指南同步任务复用及重新验收规则
- [x] #2 仓库包含可安装的 Skill 和安装说明
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bun run check:types passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
同步六份生命周期指南；复制 Skill 与元数据；补充安装说明并验证。
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
已同步 CLI/MCP 六份生命周期指南：原范围小修复可重开，实施前必须进入进行中，重新验证后完成；新功能和独立需求单独建任务并去重。仓库加入 skills/easybacklog 完整 Skill 及元数据，README 提供安装路径、调用方法、前置条件和源码指南版本说明。Skill 校验通过；agent-instructions 测试 17 通过、1 跳过；Biome 通过。
<!-- SECTION:FINAL_SUMMARY:END -->
