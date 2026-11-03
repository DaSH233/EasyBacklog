---
id: BACK-798
title: 精简常用任务指南与任务记录规范
status: Done
assignee:
  - '@Codex'
created_date: '2026-10-30T06:50:00Z'
updated_date: '2026-10-30T08:38:00Z'
labels: []
dependencies: []
ordinal: 408000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
常用指南包含大量参数和边界说明，任务记录重复叙述增加上下文开销；需要按需读取详细参考并保留交接和验收证据。
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 CLI/MCP 常用指南精简且详细参考可通过工具加载
- [x] #2 两份 Skill 同步精简记录规则，验收与 DoD 要求不变
- [x] #3 验证指南路由、Skill 及相关测试，报告文本缩减量
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bun run check:types passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
将复杂参数与生命周期细节提取为按需参考；精简核心指南和记录规范；同步 Skill 并验证 CLI/MCP 暴露与验收要求。
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
一致性修复：统一小修复与子任务例外、项目状态、缓存读取和限量查询；去重 MCP 参考并补齐旧记录错误处理。
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
常用指南减少 29.4% 字符，Skill 从 3483 减至 2040 字符；复杂操作移入可通过 CLI/MCP 加载的 workflow-reference。记录保留新增事实、验证命令/场景及结果、失败/跳过和遗留事项，历史不改写，验收/DoD/交互验证与审批不降级。两份 Skill 一致且校验通过；52 项相关测试中 51 通过、1 跳过；类型、格式及构建通过。修正 doc create --content 已实现后遗留的帮助断言；比例为字符量变化而非实际 token 用量。

一致性修复：移除后续工作强制建子任务规则，小修复例外覆盖子任务；MCP 使用项目配置状态，统一缓存读取与限量查询，合并重复速查并补齐旧记录边界错误处理。两份 Skill 及元数据一致且校验通过；CLI/MCP 验收规则保留；相关测试 51 通过、1 跳过，类型和格式检查通过。
<!-- SECTION:FINAL_SUMMARY:END -->
