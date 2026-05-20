# Drawio Npm Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package this draw.io webapp as an npm-consumable runtime with React and Vue iframe wrappers.

**Architecture:** Keep draw.io as isolated static iframe assets under `dist/drawio`. Add a small framework-neutral core that builds iframe URLs, filters/normalizes postMessage payloads, and exposes a command bridge. React and Vue wrappers use that core without importing draw.io globals.

**Tech Stack:** Native ESM, TypeScript declaration files, Node test runner, React optional peer dependency, Vue optional peer dependency.

---

### File Structure

- Create `package-src/core/index.js`: framework-neutral URL, message, bridge, and debounce utilities.
- Create `package-src/core/index.d.ts`: public TypeScript types.
- Create `package-src/react/index.js`: React `DrawioEditor` component.
- Create `package-src/react/index.d.ts`: React component types.
- Create `package-src/vue/index.js`: Vue 3 `DrawioEditor` component.
- Create `package-src/vue/index.d.ts`: Vue component types.
- Create `test/core.test.js`: Node tests for stable core behavior.
- Create `scripts/build-npm-package.js`: copy static runtime and wrapper files into `dist/`.
- Modify `package.json`: npm package metadata, exports, scripts, optional peers.
- Create `NPM_PACKAGE.md`: package integration guide.

### Task 1: Core Tests

- [ ] Write tests in `test/core.test.js` for URL generation, message parsing, origin filtering, and request ID generation.
- [ ] Run `node --test test/core.test.js` and confirm it fails because `package-src/core/index.js` does not exist.

### Task 2: Core Implementation

- [ ] Implement `buildDrawioUrl`, `parseDrawioMessage`, `isAllowedOrigin`, `createRequestId`, `createDebounced`, and `createDrawioBridge` in `package-src/core/index.js`.
- [ ] Add matching declarations in `package-src/core/index.d.ts`.
- [ ] Run `node --test test/core.test.js` and confirm it passes.

### Task 3: React Wrapper

- [ ] Implement `package-src/react/index.js` using `forwardRef`, iframe rendering, bridge setup, props, and event callbacks.
- [ ] Add React declarations in `package-src/react/index.d.ts`.
- [ ] Keep React as an optional peer dependency.

### Task 4: Vue Wrapper

- [ ] Implement `package-src/vue/index.js` using `defineComponent`, iframe rendering, bridge setup, props, emits, and exposed API.
- [ ] Add Vue declarations in `package-src/vue/index.d.ts`.
- [ ] Keep Vue as an optional peer dependency.

### Task 5: Npm Build

- [ ] Implement `scripts/build-npm-package.js` to copy draw.io static assets to `dist/drawio` and package source files to `dist/core`, `dist/react`, and `dist/vue`.
- [ ] Modify `package.json` to publish `dist`, expose package entrypoints, add `build:npm`, and keep existing static deployment scripts available.
- [ ] Run `npm run build:npm` and inspect `dist`.

### Task 6: Documentation

- [ ] Write `NPM_PACKAGE.md` with install, Vite static copy, React usage, Vue usage, props, events, instance API, and v1 limits.

### Task 7: Verification

- [ ] Run `node --test test/core.test.js`.
- [ ] Run `node --check package-src/core/index.js package-src/react/index.js package-src/vue/index.js scripts/build-npm-package.js`.
- [ ] Run `npm run build:npm`.
- [ ] Run `npm run check`.
