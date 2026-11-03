---
id: BACK-799
title: 初始化时选择 AI 自动任务管理权限
status: Done
assignee:
  - '@Codex'
created_date: '2026-10-30T09:08:00Z'
updated_date: '2026-10-30T09:17:00Z'
labels: []
dependencies: []
ordinal: 409000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
用户需要在初始化前决定是否让 AI 自动创建和更新任务，避免开发请求默认产生任务记录。
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 CLI 与 Web 初始化先选择权限并持久化，默认关闭且重新初始化保留已有选择
- [x] #2 CLI/MCP 指南和两份 Skill 尊重项目权限，显式任务操作仍可使用
- [x] #3 覆盖初始化、配置读写、指南和页面交互验证
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bun run check:types passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
新增项目权限配置；接入 CLI/Web 初始化和配置命令；动态指南展示权限并同步 Skill；测试持久化、参数校验、指南及 UI。
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
CLI/Web 初始化新增首步 AI 自动任务管理许可，默认关闭；支持非交互 true/false 参数、持久化、重初始化保留与 config get/set。CLI/MCP 指南动态显示权限，两份 Skill 优先遵守，显式任务操作不受阻；这是代理工作流权限而非 API 鉴权。验证：171 项测试通过、1 跳过；类型、格式、构建及 Skill 校验通过。浏览器模拟接口验证中英文、双选项、返回保留、确认页及提交参数；终端实测权限提示先于项目名且默认 No。既有项目配置未修改。
<!-- SECTION:FINAL_SUMMARY:END -->
