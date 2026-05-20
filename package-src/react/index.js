import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef
} from 'react';

import {
  buildDrawioUrl,
  createDebounced,
  createDrawioBridge,
  resolveLocale
} from '../core/index.js';

function resolveSize(value, fallback) {
  if (value == null) {
    return fallback;
  }

  return typeof value === 'number' ? `${value}px` : value;
}

export const DrawioEditor = forwardRef(function DrawioEditor(props, ref) {
  const {
    assetBase,
    value,
    defaultValue,
    mode = 'edit',
    lang,
    locale = lang || 'en',
    messages,
    config,
    urlParams,
    autosave = false,
    changeDebounceMs = 300,
    readOnly = false,
    width = '100%',
    height = '100%',
    className,
    style,
    sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups allow-downloads',
    allowedOrigin = '*',
    targetOrigin = '*',
    onReady,
    onLoad,
    onChange,
    onSave,
    onExport,
    onClose,
    onError,
    onDirtyChange,
    onMessage,
    title = 'draw.io editor'
  } = props;

  const iframeRef = useRef(null);
  const bridgeRef = useRef(null);
  const latestValueRef = useRef(value);
  const callbacksRef = useRef({});
  const resolvedLocale = useMemo(() => resolveLocale({
    locale,
    lang,
    messages
  }), [locale, lang, messages]);

  callbacksRef.current = {
    onReady,
    onLoad,
    onChange,
    onSave,
    onExport,
    onClose,
    onError,
    onDirtyChange,
    onMessage
  };

  const src = useMemo(() => buildDrawioUrl({
    assetBase,
    mode,
    lang: resolvedLocale.lang,
    config,
    urlParams
  }), [assetBase, mode, resolvedLocale.lang, config, urlParams]);

  useImperativeHandle(ref, () => ({
    loadXml(xml) {
      return bridgeRef.current?.loadXml(xml) || Promise.reject(new Error('Draw.io editor is not ready'));
    },
    async getXml() {
      const message = await bridgeRef.current?.getXml();
      return message?.xml || message?.data || '';
    },
    async save() {
      const message = await bridgeRef.current?.save();
      return message?.xml || message?.data || '';
    },
    clear() {
      return bridgeRef.current?.loadXml('') || Promise.reject(new Error('Draw.io editor is not ready'));
    },
    export(options) {
      return bridgeRef.current?.export(options) || Promise.reject(new Error('Draw.io editor is not ready'));
    },
    exportAs(format, options) {
      return bridgeRef.current?.exportAs(format, options) || Promise.reject(new Error('Draw.io editor is not ready'));
    },
    setReadOnly(nextReadOnly) {
      return bridgeRef.current?.setReadOnly(nextReadOnly) || Promise.reject(new Error('Draw.io editor is not ready'));
    },
    setModified(modified) {
      return bridgeRef.current?.setModified(modified) || Promise.reject(new Error('Draw.io editor is not ready'));
    },
    focus() {
      iframeRef.current?.focus();
    },
    reload() {
      if (iframeRef.current != null) {
        iframeRef.current.src = src;
      }
    },
    destroy() {
      bridgeRef.current?.destroy();
      bridgeRef.current = null;
    },
    send(command) {
      return bridgeRef.current?.post(command.action, command) || Promise.reject(new Error('Draw.io editor is not ready'));
    }
  }), [src]);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  useEffect(() => {
    const frame = iframeRef.current;

    if (frame == null) {
      return undefined;
    }

    const emitChange = createDebounced((xml, message) => {
      callbacksRef.current.onChange?.(xml, message);
    }, changeDebounceMs);

    const bridge = createDrawioBridge({
      frame,
      targetOrigin,
      allowedOrigin,
      onMessage(message, event) {
        callbacksRef.current.onMessage?.({ message, event });

        switch (message.event || message.action) {
          case 'configure':
            if (config != null) {
              bridge.post('configure', { config });
            }
            break;
          case 'init':
          case 'ready': {
            const initialXml = latestValueRef.current ?? defaultValue;

            if (initialXml != null) {
              bridge.loadXml(initialXml);
            }

            if (readOnly) {
              bridge.setReadOnly(true);
            }

            callbacksRef.current.onReady?.(api);
            break;
          }
          case 'load':
            callbacksRef.current.onLoad?.(message);
            break;
          case 'autosave':
          case 'change':
            if (autosave || message.event === 'change') {
              emitChange(message.xml || message.data || '', message);
            }
            break;
          case 'save':
            callbacksRef.current.onSave?.(message);
            break;
          case 'export':
            callbacksRef.current.onExport?.(message);
            break;
          case 'exit':
          case 'close':
            callbacksRef.current.onClose?.(message);
            break;
          case 'error':
            callbacksRef.current.onError?.(message);
            break;
          case 'dirty':
          case 'modified':
            callbacksRef.current.onDirtyChange?.(Boolean(message.modified ?? message.dirty));
            break;
          default:
            break;
        }
      }
    });

    const api = {
      loadXml: (xml) => bridge.loadXml(xml),
      getXml: async () => {
        const message = await bridge.getXml();
        return message?.xml || message?.data || '';
      },
      save: async () => {
        const message = await bridge.save();
        return message?.xml || message?.data || '';
      },
      clear: () => bridge.loadXml(''),
      export: (options) => bridge.export(options),
      exportAs: (format, options) => bridge.exportAs(format, options),
      setReadOnly: (nextReadOnly) => bridge.setReadOnly(nextReadOnly),
      setModified: (modified) => bridge.setModified(modified),
      focus: () => iframeRef.current?.focus(),
      reload: () => {
        if (iframeRef.current != null) {
          iframeRef.current.src = src;
        }
      },
      destroy: () => bridge.destroy(),
      send: (command) => bridge.post(command.action, command)
    };

    bridgeRef.current = bridge;

    window.addEventListener('message', bridge.handleMessage);

    return () => {
      window.removeEventListener('message', bridge.handleMessage);
      bridge.destroy();
      bridgeRef.current = null;
    };
  }, [allowedOrigin, autosave, changeDebounceMs, config, defaultValue, readOnly, src, targetOrigin]);

  useEffect(() => {
    if (value !== undefined && value !== latestValueRef.current) {
      latestValueRef.current = value;
      bridgeRef.current?.loadXml(value);
    }
  }, [value]);

  return React.createElement('iframe', {
    ref: iframeRef,
    src,
    title,
    className,
    sandbox,
    'aria-label': resolvedLocale.messages.ready,
    style: {
      width: resolveSize(width, '100%'),
      height: resolveSize(height, '100%'),
      border: 0,
      display: 'block',
      ...style
    }
  });
});
