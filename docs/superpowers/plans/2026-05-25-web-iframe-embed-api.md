# Web Iframe Embed API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a static-web iframe embed protocol to the deployed draw.io lite page without packaging it as npm.

**Architecture:** Add `js/embed-api.js` as a small browser plugin loaded by `index.html` before `js/main.js`. The plugin waits for draw.io's existing `Draw.loadPlugin` hook, receives the active `EditorUi` instance, handles lite `postMessage` commands, and emits stable JSON events to `window.parent` or `window.opener`.

**Tech Stack:** Plain browser JavaScript, existing draw.io globals, Node `vm` tests for protocol utilities, existing static deployment scripts.

---

### File Structure

- Create `js/embed-api.js`: lightweight iframe protocol, command handlers, event emitters, and Draw plugin registration.
- Create `test/embed-api.test.js`: Node tests for protocol parsing, response creation, and command routing with fake editor UI.
- Modify `index.html`: load `js/embed-api.js` before `js/main.js`.
- Modify `scripts/prepare-static-deploy.js`: require `js/embed-api.js` in deployment checks.
- Modify `README.md`: document iframe usage, parameters, commands, and events.

### Protocol Scope

- URL parameters: `embed=1`, `proto=json`, `lite=1`, `autosave=1`, `readOnly=1`, `lang=zh|en`.
- Commands: `load`, `getXml`, `save`, `export`, `exportAs`, `setReadOnly`, `undo`, `redo`, `fit`, `zoom`, `clear`.
- Events: `ready`, `load`, `change`, `save`, `export`, `error`, `dirty`.
- Unsupported heavy export paths can still use draw.io official embed protocol directly.

### Verification

- `node --test test/embed-api.test.js`
- `node --check js/embed-api.js`
- `npm run check`
- `npm run build`
- `node --check service-worker.js`
