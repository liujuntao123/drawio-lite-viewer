# Drawio Lite Viewer / NPM Package

这是一个基于 draw.io 30.0.2 前端静态资源改造的轻量查看器/基础编辑器。项目目标不是保留完整 draw.io 工作台，而是提供简洁白板、基础图形编辑、缩放和导出能力。

项目现在支持两种使用方式：

- 作为静态 WebApp 部署到 Vercel 或 Cloudflare Pages。
- 作为 npm 包构建，供 React 或 Vue 现代前端项目通过 iframe wrapper 引入。

## 当前定位

- 默认进入轻量编辑体验。
- 画布铺满屏幕，默认关闭网格、分页边界和页脚页签。
- 使用悬浮工具栏替代传统密集菜单栏。
- 保留基础图形、文本、连线、图片、链接、撤销/重做、缩放和导出。
- 图形被选中时显示格式面板，方便修改样式。
- 默认语言为中文。
- npm 包形态保留 draw.io 静态运行时隔离，React/Vue 只通过 `postMessage` 通信。

## 目录结构

```text
.
├── index.html                      # 静态入口
├── js/
│   ├── bootstrap.js                # 启动加载器
│   ├── main.js                     # 页面启动入口
│   ├── app.min.js                  # 实际线上运行的主 bundle
│   ├── diagramly/
│   │   ├── Init.js                 # 全局初始化、语言和路径配置
│   │   └── Minimal.js              # 轻量模式和悬浮 UI 的主要源码
│   └── grapheditor/
│       └── Editor.js               # 编辑器核心默认行为
├── styles/
│   └── grapheditor.css             # 主样式，包含轻量悬浮 UI 样式
├── resources/                      # i18n 文案资源
├── images/ img/ shapes/ stencils/  # draw.io 图形和素材资源
├── scripts/
│   ├── build-npm-package.js        # 生成 npm 包 dist
│   ├── prepare-static-deploy.js    # 生成静态部署 dist
│   └── serve-dist.js               # 本地预览 dist
├── package-src/
│   ├── core/                       # iframe 通信、URL 和多语言工具
│   ├── react/                      # React DrawioEditor wrapper
│   └── vue/                        # Vue 3 DrawioEditor wrapper
├── test/                           # Node 核心测试
├── NPM_PACKAGE.md                  # npm 包集成说明
├── service-worker.js               # 离线/缓存清单
├── vercel.json                     # Vercel 配置
├── wrangler.toml                   # Cloudflare Pages 配置
└── DEPLOYMENT.md                   # 部署说明
```

`META-INF/`、`WEB-INF/` 是原 Java Web 包目录，静态部署不需要，已通过 `.gitignore` 和构建脚本排除。

## 常用命令

```bash
npm run check
```

检查静态部署所需文件是否齐全。

```bash
npm run build
```

生成 npm 包形态的 `dist/`，包含 `dist/drawio`、`dist/core`、`dist/react` 和 `dist/vue`。

```bash
npm run build:npm
```

等价于 `npm run build`，用于生成 npm 包产物。

```bash
npm run build:static
```

生成静态部署形态的 `dist/`。Vercel 和 Cloudflare Pages 应使用这个命令。

```bash
npm test
```

运行 npm 包核心层测试。

```bash
npm run preview
```

启动本地预览服务，默认地址是 `http://localhost:3000/`。如端口冲突：

```bash
PORT=3100 npm run preview
```

## 部署

Vercel:

- Build Command: `npm run build:static`
- Output Directory: `dist`
- 如果仓库根目录不是当前目录，需要把项目根目录设置到 `src/main/webapp`

Cloudflare Pages:

- Build command: `npm run build:static`
- Build output directory: `dist`
- 也可使用 `wrangler.toml` 中的 `pages_build_output_dir = "dist"`

更详细的部署说明见 `DEPLOYMENT.md`。

## npm 包集成

包入口在 `package.json` 的 `exports` 中声明：

```ts
import { DrawioEditor } from '@your-scope/drawio-editor/react';
import { DrawioEditor } from '@your-scope/drawio-editor/vue';
```

React/Vue wrapper 支持：

- `assetBase` 指向公开可访问的 `dist/drawio` 静态资源。
- `value` / `v-model` 传入和同步 XML。
- `onChange`、`onSave`、`onExport`、`onError` 等事件。
- `ref` / Vue expose 调用 `loadXml()`、`getXml()`、`save()`、`export()`、`exportAs()`。
- `locale="zh"` / `locale="en"` 以及 `messages` 自定义中英文 wrapper 文案。
- `config` 和 `urlParams` 透传 draw.io 配置。

详细用法见 `NPM_PACKAGE.md`。

发布前需要把 `package.json` 里的占位包名 `@your-scope/drawio-editor` 改成真实 npm scope/name。

## 关键改造点

### 轻量模式

主要在 `js/diagramly/Minimal.js`：

- 默认禁用传统侧栏和格式面板常驻显示。
- 新增悬浮菜单、基础图形工具、缩放、撤销/重做按钮。
- 菜单使用中文，保留打开、保存、另存为、导出 PNG/SVG/XML。
- 选中图形时自动打开格式浮窗。

### 画布默认行为

主要在 `js/grapheditor/Editor.js`：

- `gridEnabled = false`
- `pageVisible = false`
- `pageBreaksVisible = false`
- 读取旧文件时默认也不显示页边界，除非显式 URL 参数覆盖。

### 中文默认语言

主要在 `js/diagramly/Init.js`：

- 没有 URL 参数或本地设置时，默认返回 `zh`。
- 中文资源依赖 `resources/dia_zh.txt`。

### 样式与布局

主要在 `styles/grapheditor.css`：

- 定义 `.geFloatingShell` 和 `.geFloat*` 悬浮工具栏样式。
- 隐藏不需要的传统容器、页签和滚动条视觉。
- 保持画布交互可滚动/平移，但减少可见噪音。

## 维护注意事项

这个项目默认加载的是 `js/app.min.js`，不是源码目录里的单个 JS 文件。因此修改 draw.io 运行时行为时要注意：

1. 如果改了 `js/diagramly/Minimal.js`、`js/diagramly/Init.js`、`js/grapheditor/Editor.js` 或 CSS，必须确认同样的改动已经同步到 `js/app.min.js` 或最终运行 bundle。
2. 如果改动会影响离线缓存或静态资源版本，需要同步检查 `service-worker.js`。
3. 每次准备部署前至少运行：

```bash
npm test
npm run build:npm
npm run check
npm run build:static
node --check js/app.min.js
node --check service-worker.js
```

4. 本地预览静态 WebApp 时先运行 `npm run build:static`，然后 `npm run preview`，不要直接打开 `index.html` 文件。
5. npm 包构建不会重写 draw.io 源码，只复制运行时资源到 `dist/drawio`，wrapper 代码来自 `package-src/`。

## 当前 GitHub 仓库

```text
https://github.com/liujuntao123/drawio-lite-viewer
```

当前仓库是 private。部署到 Vercel 或 Cloudflare 时，需要让平台有访问该私有仓库的权限。
