---
id: BACK-801
title: 优化看板首次加载速度
status: Done
assignee:
  - '@codex'
created_date: '2026-11-10T07:57:00Z'
updated_date: '2026-11-10T12:28:00Z'
labels: []
dependencies: []
references:
  - >-
    https://github.com/DaSH233/EasyBacklog/commit/591fa8129f9fcaf0eaf99853ac9054027a4b747e
modified_files:
  - src/web/App.tsx
  - src/web/components/Layout.tsx
  - scripts/build.ts
  - README.md
type: enhancement
ordinal: 411000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
当前项目看板首次打开较慢。已测得入口 JavaScript 约 7.5 MB；热请求通常为毫秒级，但搜索接口曾出现约 1.27 秒响应。需要用实测区分静态资源、冷启动和数据加载开销。
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 记录优化前后同环境下的首屏资源大小与接口耗时，确认有可量化改善
- [x] #2 首次打开看板无需加载未使用的详情编辑与归档内容，打开相关页面后功能正常
- [x] #3 源码启动和构建后的 CLI 均可正常加载页面与资源，任务详情、路由和未保存保护回归通过
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
测量页面资源和实际 API；延迟加载包含 Markdown 的页面与详情弹窗，并验证 Bun 的实际分包行为；按范围运行类型、格式、构建和回归测试，再做浏览器验证。

最小示例确认原生 HTML 源码服务会内联合并动态导入；单文件 CLI 构建启用 splitting 后可内嵌多个前端 chunk。保留现有服务架构，为正式构建开启分包，并用构建后的 CLI 提供当前看板。源码启动继续作为开发方式验证可用，不承诺相同传输体积。
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
已完成入口按需加载改动，24 项相关回归、类型检查、Biome 和构建通过；当前源码启动的 Bun 1.3.13 仍生成约 7.5 MB 单文件，尚未证明首屏体积改善，继续调查打包配置。

同环境正式构建对照：改动前入口 JS 7,515,856 B；改动后入口及静态依赖合计 696,990 B，减少 90.7%。83 个静态/动态 JS chunk 均 HTTP 200。基线搜索采样 2835/413/381 ms，优化版 122/124/137 ms；数据层未改动，不将接口波动归因于前端分包。基线冷启动曾连接断开，初始化完成后恢复；源码可见首次语料加载等待远程 refs 刷新，仍是独立延迟来源。
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
任务详情、文档、决策和归档页面改为按需加载，关闭的任务弹窗不再提前挂载；Bun 正式构建开启 splitting，保留单文件 CLI 分发。首屏静态 JS 由 7.52 MB 减至 0.70 MB（90.7%）。验证：24 项相关回归/114 断言通过；bun run check:types、Biome、bun run build 和 git diff --check 通过；构建 CLI 可读取任务，83 个前端分包正常；浏览器确认看板、任务阅读/编辑取消、归档及文档/决策空态可用，无控制台错误。README 已说明使用构建产物；当前 6420 看板已切换至优化构建。限制：源码开发服务仍生成单包，冷启动远程同步等待未改变；未测量端到端首屏渲染时间，未测试其他操作系统。改动未提交。
<!-- SECTION:FINAL_SUMMARY:END -->
