# Android 手机横屏体验 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 安卓手机一次点击进入横屏，并在四幕中完整使用原有内容和玩法；电脑端不变。

**Architecture:** `App` 识别安卓手机并管理全屏、方向锁定与进入页。横屏布局样式只作用于安卓手机的根节点，四幕增加可定位的样式类；不改变桌面布局逻辑。

**Tech Stack:** React 19、TypeScript、Tailwind CSS、Screen Orientation API、Fullscreen API。

## Global Constraints

- 只调整安卓手机体验；PC 不显示横屏入口，也不使用手机布局。
- 保留四幕现有内容、导航、3D 模型与拖动玩法。
- 浏览器拒绝锁定时允许用户手动横过手机进入。

---

### Task 1: 横屏进入与方向状态

**Files:** Modify `src/App.tsx`, `src/index.css`。

- [x] 在 `App` 初始化时识别安卓手机，并监听横竖屏状态变化。
- [x] 增加一次点击的全屏与 `screen.orientation.lock('landscape')` 请求；请求失败时显示手动旋转提示。
- [x] 只在安卓手机竖屏或首次进入时显示引导；电脑端沿用现有渲染。
- [x] 运行 `npm run build` 检查 TypeScript 和构建。

### Task 2: 四幕横屏布局

**Files:** Modify `src/App.tsx`, `src/phases/Phase1Scene.tsx`, `src/phases/Phase2Scene.tsx`, `src/phases/Phase3Scene.tsx`, `src/phases/Phase4Scene.tsx`, `src/index.css`。

- [x] 给顶栏与各幕关键容器增加稳定的样式类。
- [x] 添加安卓手机作用域样式，将顶栏压成单行，将二、四幕变成低高度横屏三栏并允许侧栏独立滚动。
- [x] 调整第一幕提示与第三幕舞台尺寸，使触屏目标和继续流程可见。
- [x] 运行 `npm run lint` 和 `npm run build`。

### Task 3: 浏览器核验

**Files:** No source changes unless a concrete issue is found.

- [x] 在桌面宽屏与安卓手机竖屏、横屏视口检查首屏、四幕导航、可见区域和滚动。
- [x] 核验擦雾、模型选择、点灯、沙盘拖动，以及方向锁定失败后的回退；热点模型随切换正常显示。浏览器模拟器无法验证真实手机的系统方向锁定。
