# NPM Package Integration

This package exposes the draw.io webapp as iframe-hosted static assets plus small React and Vue wrappers. The wrappers do not import draw.io internals; they communicate with the iframe through `postMessage`.

## Build

```bash
npm run build:npm
```

The npm build writes:

```text
dist/
  drawio/      # static draw.io runtime
  core/        # framework-neutral bridge
  react/       # React wrapper
  vue/         # Vue 3 wrapper
```

## Static Assets

The host application must serve `dist/drawio` from a public URL. A common Vite setup uses `vite-plugin-static-copy`:

```ts
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@your-scope/drawio-editor/dist/drawio',
          dest: 'vendor'
        }
      ]
    })
  ]
});
```

Then pass `/vendor/drawio` as `assetBase`.

## React

```tsx
import { useRef, useState } from 'react';
import { DrawioEditor } from '@your-scope/drawio-editor/react';
import type { DrawioEditorApi } from '@your-scope/drawio-editor/react';

export function DiagramEditor() {
  const editorRef = useRef<DrawioEditorApi>(null);
  const [xml, setXml] = useState('<mxfile><diagram /></mxfile>');

  return (
    <DrawioEditor
      ref={editorRef}
      assetBase="/vendor/drawio"
      value={xml}
      locale="zh"
      autosave
      changeDebounceMs={500}
      onChange={(nextXml) => setXml(nextXml)}
      onSave={(event) => console.log(event.xml)}
      onError={(error) => console.error(error)}
      style={{ minHeight: 640 }}
    />
  );
}
```

## Vue 3

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { DrawioEditor } from '@your-scope/drawio-editor/vue';

const xml = ref('<mxfile><diagram /></mxfile>');

function saveDiagram(event: unknown) {
  console.log(event);
}
</script>

<template>
  <DrawioEditor
    v-model="xml"
    asset-base="/vendor/drawio"
    locale="zh"
    :autosave="true"
    :iframe-style="{ minHeight: '640px' }"
    @save="saveDiagram"
    @error="console.error"
  />
</template>
```

## Props

| Prop | Description |
| --- | --- |
| `assetBase` | Public URL where `dist/drawio` is served. Required. |
| `value` / `modelValue` | Controlled XML content. |
| `defaultValue` | Initial XML for uncontrolled usage. |
| `mode` | `edit` or `view`. Defaults to `edit`. |
| `locale` | Wrapper locale. Built-in values are `zh` and `en`; defaults to `en`. |
| `lang` | draw.io language code. Overrides the draw.io URL `lang` value when needed. |
| `messages` | Wrapper message overrides keyed by locale, for example `{ zh: { loading: '加载中' } }`. |
| `config` | draw.io configuration object sent during configure handshake. |
| `urlParams` | Extra draw.io URL parameters. Boolean `true` is encoded as `1`; `false` and `null` are omitted. |
| `autosave` | Emits change updates from draw.io autosave messages. |
| `changeDebounceMs` | Debounce for change events. Defaults to `300`. |
| `readOnly` | Sends a read-only command after the iframe is ready. |
| `allowedOrigin` | Origin filter for iframe messages. Defaults to `*`. |
| `targetOrigin` | Origin used when sending messages to the iframe. Defaults to `*`. |
| `sandbox` | iframe sandbox attribute. |

## Events

| Event | React prop | Vue emit |
| --- | --- | --- |
| Ready | `onReady(api)` | `ready` |
| Loaded | `onLoad(event)` | `load` |
| Changed | `onChange(xml, event)` | `change`, `update:modelValue` |
| Saved | `onSave(event)` | `save` |
| Exported | `onExport(event)` | `export` |
| Closed | `onClose(event)` | `close` |
| Error | `onError(error)` | `error` |
| Dirty state | `onDirtyChange(dirty)` | `dirty-change` |
| Raw message | `onMessage(event)` | `message` |

## Instance API

React exposes the API through `ref`. Vue exposes it through the component instance.

```ts
type DrawioEditorApi = {
  loadXml(xml: string): Promise<unknown>;
  getXml(): Promise<string>;
  save(): Promise<string>;
  clear(): Promise<unknown>;
  export(options: { format: 'xml' | 'svg' | 'png' | 'pdf' }): Promise<unknown>;
  exportAs(format: 'xml' | 'svg' | 'png' | 'pdf', options?: {
    transparent?: boolean;
    scale?: number;
    border?: number;
  }): Promise<unknown>;
  setReadOnly(readOnly: boolean): Promise<unknown>;
  setModified(modified: boolean): Promise<unknown>;
  focus(): void;
  reload(): void;
  destroy(): void;
  send(command: { action: string; [key: string]: unknown }): Promise<unknown>;
};
```

Example export call:

```ts
await editorRef.current?.exportAs('png', {
  transparent: true,
  scale: 2,
  border: 8
});
```

## Localization

The wrapper has built-in English and Chinese messages:

```tsx
<DrawioEditor assetBase="/vendor/drawio" locale="zh" />
<DrawioEditor assetBase="/vendor/drawio" locale="en" />
```

Override wrapper messages per language:

```tsx
<DrawioEditor
  assetBase="/vendor/drawio"
  locale="zh"
  messages={{
    zh: {
      loading: '正在打开图表',
      ready: '编辑器准备好了'
    },
    en: {
      loading: 'Opening diagram',
      ready: 'Editor is ready'
    }
  }}
/>
```

`locale` controls wrapper messages and defaults the draw.io `lang` URL parameter. Use `lang` only when the draw.io runtime needs a different language code than the wrapper locale.

## V1 Limits

- draw.io remains isolated in an iframe.
- The package does not expose `EditorUi`, `Graph`, `mxGraph`, or other draw.io globals.
- The package does not split the draw.io toolbar into React or Vue components.
- Multiple editor instances should use separate iframes.
- The host application is responsible for serving the static runtime assets.
