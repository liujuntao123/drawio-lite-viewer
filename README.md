# Drawio Lite Viewer

这是一个基于 draw.io 30.0.2 前端静态资源改造的轻量查看器/基础编辑器。项目目标不是保留完整 draw.io 工作台，而是提供简洁白板、基础图形编辑、缩放和导出能力，并能直接部署到 Vercel 或 Cloudflare Pages。

## 当前定位

- 默认进入轻量编辑体验。
- 画布铺满屏幕，默认关闭网格、分页边界和页脚页签。
- 使用悬浮工具栏替代传统密集菜单栏。
- 保留基础图形、文本、连线、图片、链接、撤销/重做、缩放和导出。
- 图形被选中时显示格式面板，方便修改样式。
- 默认语言为中文。

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
│   ├── prepare-static-deploy.js    # 生成 dist 静态部署包
│   └── serve-dist.js               # 本地预览 dist
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

生成 `dist/`。部署平台应使用这个目录作为静态输出。

```bash
npm run preview
```

启动本地预览服务，默认地址是 `http://localhost:3000/`。如端口冲突：

```bash
PORT=3100 npm run preview
```

## 部署

Vercel:

- Build Command: `npm run build`
- Output Directory: `dist`
- 如果仓库根目录不是当前目录，需要把项目根目录设置到 `src/main/webapp`

Cloudflare Pages:

- Build command: `npm run build`
- Build output directory: `dist`
- 也可使用 `wrangler.toml` 中的 `pages_build_output_dir = "dist"`

更详细的部署说明见 `DEPLOYMENT.md`。

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
npm run check
npm run build
node --check js/app.min.js
node --check service-worker.js
```

4. 本地预览时先运行 `npm run build`，然后 `npm run preview`，不要直接打开 `index.html` 文件。

## 当前 GitHub 仓库

```text
https://github.com/liujuntao123/drawio-lite-viewer
```

当前仓库是 private。部署到 Vercel 或 Cloudflare 时，需要让平台有访问该私有仓库的权限。
