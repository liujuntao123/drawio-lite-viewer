# 部署说明

这个目录已经整理成零框架的静态前端项目。入口是 `index.html`，运行时资源都通过相对路径加载。

## 本地构建

```bash
npm run build
```

构建产物会输出到 `dist/`。脚本会排除 `META-INF/`、`WEB-INF/`、`scripts/`、`node_modules/` 等非静态运行目录。

## 本地预览

```bash
npm run build
npm run preview
```

## Vercel

方式一：连接仓库后使用当前目录作为项目根目录。`vercel.json` 已配置：

- Build Command: `npm run build`
- Output Directory: `dist`

方式二：使用 CLI：

```bash
npm run deploy:vercel
```

## Cloudflare Pages

Cloudflare Pages 配置：

- Build command: `npm run build`
- Build output directory: `dist`

也可以用 Wrangler：

```bash
npm run deploy:cloudflare
```

## 缓存说明

当前配置让 HTML、JS、CSS 和 service worker 都走重新校验缓存，避免部署后浏览器继续使用旧版 `app.min.js` 或 `grapheditor.css`。
