---
id: BACK-805
title: 修复任务空标题反馈与看板中文遗漏
status: Done
assignee:
  - '@codex'
created_date: '2026-11-16T09:52:00Z'
updated_date: '2026-11-16T11:49:00Z'
labels: []
dependencies: []
references:
  - >-
    https://github.com/DaSH233/EasyBacklog/commit/682ea9ded6a992869ab860a4360615d75d2d1572
modified_files:
  - src/test/web-language.test.tsx
  - src/web/components/TaskDetailsModal.tsx
  - src/web/components/TaskColumn.tsx
type: bug
ordinal: 415000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
修复真实浏览器复验发现的既有问题：任务详情清空标题失焦无反馈、空列和拖动提示未翻译，以及完成总结重复英文说明。保持现有保存与增量刷新行为，补充回归测试并在真实浏览器复验，不提交。
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 空标题和纯空白标题得到可见反馈，不发送无效更新，修正后可正常保存
- [x] #2 中文空列与拖动提示使用现有翻译，完成总结不再出现重复英文说明，用户数据保持原样
- [x] #3 回归测试、真实浏览器复验与相关检查通过，改动保持未提交
- [x] #4 空标题反馈在同任务刷新及其他元数据更新后保留；有效输入、取消或切换任务后不会残留错误
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
复用现有错误状态和翻译；增加空标题、恢复保存、语言切换及空列拖动的回归覆盖；构建后用独立项目真实浏览器复验，再运行类型、格式、Web 测试和编译产物检查。
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
实现复用现有错误状态与翻译，无新增抽象。空标题和纯空格在输入框下显示可访问的校验提示，完整编辑保存同样拦截；恢复原题可清除错误，正确标题可修剪后保存。空列和拖动提示接入现有中文翻译，删除重复 Completion summary 副标题，保留用户内容。新增 7 项回归用例并强化已有总结文案断言。42 个 Web 测试文件 355 项通过，0 失败；类型、Biome 480 文件、原生构建和 CLI/Web/MCP 冒烟通过。真实浏览器复验空标题、有效保存与重载、中英文切换、空列、拖动、增量刷新及未保存描述保留；控制台零警告错误。详见 tmp/back-805/report.txt。本轮未重跑全仓测试，未暂存或提交。

复查确认标题校验依赖通用 error，会被刷新和其他元数据更新清除。本次继续原任务：独立记录标题是否已触发校验，从当前标题派生无效状态，补充刷新、元数据更新及校验生命周期回归。

空标题刷新回归已修复：标题校验状态独立于通用请求错误，错误从当前标题派生。同任务刷新和其他元数据更新保持反馈；有效输入、取消、切换和重开正确重置。新增 7 项回归；web-language 20/20、全部 DOM 403/403、类型检查、Biome、原生构建及编译产物 CLI/Web/MCP 冒烟全部通过。真实浏览器通过 CLI 外部更新及页面状态/优先级更新复验，提示保留且修正标题可持久保存；控制台无警告/错误。详细记录 tmp/back-805-refresh/report.txt。本轮未重跑全仓测试。未暂存、未提交。
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
已修复空标题缺少反馈、看板中文遗漏及反馈被增量刷新/元数据更新清除的问题。标题校验与请求错误解耦，支持正确保留及重置。新增刷新和元数据更新等 7 项回归，403 项 DOM 测试及类型、Biome、构建、冒烟检查通过；真实浏览器复验通过。所有改动保留未提交。
<!-- SECTION:FINAL_SUMMARY:END -->
