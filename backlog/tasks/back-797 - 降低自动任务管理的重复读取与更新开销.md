---
id: BACK-797
title: 降低自动任务管理的重复读取与更新开销
status: Done
assignee:
  - '@Codex'
created_date: '2026-10-30T06:31:00Z'
updated_date: '2026-10-30T06:33:00Z'
labels: []
dependencies: []
ordinal: 407000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
减少指南重复加载、无界查询和小修复的重复记录，同时保留验收证据、状态转换和授权边界。
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 项目与分发 Skill 一致，CLI/MCP 指南覆盖会话缓存、按 ID 读取、简化小修复和合并更新
- [x] #2 原验收与 DoD 要求保留，缓存失效和并发修改时重新读取
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bun run check:types passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
同步两份 Skill 和 CLI/MCP 指南；检查简化流程与非简单任务计划要求的冲突；验证指南输出、Skill 和现有测试。
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
已同步项目/分发 Skill 与 CLI、MCP 指南：同会话同项目同版本复用已读指南，已知 ID 直接读取，新需求限量搜索，小修复复用计划并简化日志，相容字段合并更新。明确上下文缺失、外部修改、更新失败或结果不明等重读条件；保留全部验收、DoD、UI 交互验证及审批要求。两份 Skill 完全一致且校验通过；四份 CLI 指南渲染正常；17 项测试通过、1 项跳过；类型及格式检查通过。未测量实际 token 节省比例。
<!-- SECTION:FINAL_SUMMARY:END -->
