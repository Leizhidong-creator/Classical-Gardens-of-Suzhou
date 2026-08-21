# 全局系统主控文件 (Global System Instructions)

> **⚠️ 致 Trae AI 的最高指令：** > 在你执行任何代码编写、修改或重构前，**必须首先读取并严格遵守本文件中的所有规则**。绝对禁止跳跃式开发，禁止在没有我明确同意的情况下修改基础架构。

## 1. 项目基本信息
- **项目名称**：《游园惊梦》数字化沉浸式交互体验
- **视觉基调**：朦胧古风 (Hazy Antique Style)，使用天水碧、远山黛等低饱和度传统色彩，核心表现“光影不均”与“氛围反差”。
- **目标受众**：追求“氛围感”的国风文化审美爱好者，以及寻找轻娱乐体验的大众“云游”用户。

## 2. 核心技术栈与架构限制
- **框架**：Vite + React + TypeScript。
- **UI 布局**：Tailwind CSS。**严禁违背的三栏定律**：在涉及 3D 的页面（如瞬间二），必须强制采用“左栏导航(20%)、中栏绝对视觉中心(60%以上)、右栏隐藏抽屉(20%)”的三栏布局。
- **3D 与动画**：Three.js + `@react-three/fiber` + `@react-three/drei` 进行 3D 渲染；GSAP 进行转场与复杂 UI 动画。
- **资产路径**：所有图片 (`.jpg`, `.png`)、模型 (`.glb`) 和数据 (`.json`) 必须统一存放在 `public/assets/` 目录下。

## 3. 核心资产映射规范 (Asset Mapping)
- `bg-clear-garden.jpg` & `window-frame-mask.png`：用于瞬间一的底层实景与顶层带有透明镂空区域的花窗视觉遮罩。
- `suzhou-model.glb`：瞬间二的核心 3D 资产。注意，这是**不可拆解的高模，需保持结构完整性**。
- `tags.json`：存储 3D 空间坐标与科普文案，用于瞬间二渲染半透明的一句话科普标签。
- `ink-dark-bg.jpg`, `ink-color-bg.jpg`, `lantern-icon.png`：用于瞬间三。初始状态为压抑的昏暗水墨，点击灯笼后瞬间过渡为明亮、清透的绝美江南夜色。
- `element-*.png` (亭台、太湖石、洞门、花木)：瞬间四用于自由拖拽排列的 2D 园林元素立牌。

## 4. 阶段开发执行流 (Phase Workflow)
你必须按照以下阶段逐一开发。**当前阶段未完全通过我的测试前，绝对禁止进入下一阶段。** 每一阶段完成后，必须执行 `git add .` 与 `git commit -m "..."`。

- **Phase 0: 基建**。初始化 Vite 项目，安装 Three.js、GSAP、Tailwind 依赖，建立 `public/assets/` 文件夹并移动素材，初始化 Git。
- **Phase 1: 破雾寻幽**。实现基于 Canvas 的 `globalCompositeOperation = 'destination-out'` 鼠标滑动擦除（刮刮乐）功能，擦除面积达标后雾气消散，浮现核心文案。
- **Phase 2: 掌中微缩**。构建严格的三栏布局。在中栏加载 `suzhou-model.glb`，配置 `OrbitControls` 实现 360 度无死角欣赏。基于 `tags.json` 挂载精确的 HTML 科普标签。
- **Phase 3: 灯火阑珊**。通过 Shader 或 CSS `clip-path` 实现点击灯笼点亮场景的效果。配合 WebGL 流体特效或 SVG 湍流滤镜，在留白处凝聚出经典古诗词，文字边缘带有“水墨浮动”与“晕染”动态效果。
- **Phase 4: 窗景定制**。实现拖拽沙盘，监听元素坐标变化，使花窗视角内景象实时产生 3D 视差缩放变化。

---
**读取完毕验证**：当你读取完本文件，请立刻回复：“已读取项目主控指令，等待执行 Phase 0。”