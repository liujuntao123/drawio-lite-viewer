let requestCounter = 0;

export const DEFAULT_LOCALE_MESSAGES = {
  en: {
    loading: 'Loading diagram',
    error: 'Diagram failed to load',
    ready: 'Editor ready'
  },
  zh: {
    loading: '正在加载图表',
    error: '图表加载失败',
    ready: '编辑器已就绪'
  }
};

export function createRequestId(prefix = 'drawio') {
  requestCounter += 1;
  return `${prefix}-${requestCounter}`;
}

export function resolveLocale(options = {}) {
  const {
    locale = 'en',
    lang,
    messages = {}
  } = options;

  const normalizedLocale = locale === 'zh-CN' || locale === 'zh_Hans' ? 'zh' : locale;
  const fallbackMessages = DEFAULT_LOCALE_MESSAGES[normalizedLocale] || DEFAULT_LOCALE_MESSAGES.en;
  const overrideMessages = messages[normalizedLocale] || messages[locale] || {};

  return {
    locale: normalizedLocale,
    lang: lang || normalizedLocale,
    messages: {
      ...fallbackMessages,
      ...overrideMessages
    }
  };
}

export function buildDrawioUrl(options) {
  const {
    assetBase,
    mode = 'edit',
    lang,
    config,
    urlParams = {}
  } = options || {};

  if (!assetBase) {
    throw new Error('assetBase is required');
  }

  const base = String(assetBase).replace(/\/+$/, '');
  const params = [];

  params.push(['embed', '1']);
  params.push(['proto', 'json']);
  params.push(['spin', '1']);
  params.push(['ui', 'atlas']);

  if (mode) {
    params.push(['mode', mode]);
  }

  if (lang) {
    params.push(['lang', lang]);
  }

  if (config != null) {
    params.push(['configure', '1']);
  }

  for (const [key, value] of Object.entries(urlParams)) {
    if (value == null || value === false) {
      continue;
    }

    params.push([key, value === true ? '1' : String(value)]);
  }

  const query = params
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  return `${base}/index.html?${query}`;
}

export function parseDrawioMessage(data) {
  if (data == null) {
    return null;
  }

  if (typeof data === 'object') {
    return data;
  }

  if (typeof data !== 'string') {
    return null;
  }

  const trimmed = data.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      return null;
    }
  }

  if (trimmed.startsWith('<mxfile') || trimmed.startsWith('<mxGraphModel')) {
    return {
      event: 'xml',
      xml: data,
      raw: data
    };
  }

  return null;
}

export function isAllowedOrigin(origin, allowedOrigin) {
  if (allowedOrigin == null || allowedOrigin === '*') {
    return true;
  }

  if (allowedOrigin instanceof URL) {
    return origin === allowedOrigin.origin;
  }

  if (Array.isArray(allowedOrigin)) {
    return allowedOrigin.some((candidate) => isAllowedOrigin(origin, candidate));
  }

  return origin === String(allowedOrigin);
}

export function createDebounced(fn, delayMs = 0) {
  let timeoutId = null;

  return function debounced(...args) {
    if (timeoutId != null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn(...args);
    }, delayMs);
  };
}

export function createDrawioBridge(options) {
  const {
    frame,
    targetOrigin = '*',
    allowedOrigin = '*',
    timeoutMs = 10000,
    onMessage
  } = options || {};

  if (frame == null) {
    throw new Error('frame is required');
  }

  const pending = new Map();

  function post(action, payload = {}, waitFor) {
    const id = createRequestId();
    const message = {
      action,
      id,
      ...payload
    };

    const target = frame.contentWindow || frame;

    if (target == null || typeof target.postMessage !== 'function') {
      return Promise.reject(new Error('frame contentWindow is not available'));
    }

    target.postMessage(JSON.stringify(message), targetOrigin);

    if (!waitFor) {
      return Promise.resolve(message);
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Timed out waiting for draw.io ${waitFor} response`));
      }, timeoutMs);

      pending.set(id, {
        waitFor,
        resolve,
        reject,
        timer
      });
    });
  }

  function handleMessage(event) {
    if (!isAllowedOrigin(event.origin, allowedOrigin)) {
      return null;
    }

    const message = parseDrawioMessage(event.data);

    if (message == null) {
      return null;
    }

    if (typeof onMessage === 'function') {
      onMessage(message, event);
    }

    for (const [id, request] of pending) {
      if (message.id === id || message.event === request.waitFor || message.action === request.waitFor) {
        clearTimeout(request.timer);
        pending.delete(id);
        request.resolve(message);
        break;
      }
    }

    return message;
  }

  function destroy() {
    for (const request of pending.values()) {
      clearTimeout(request.timer);
      request.reject(new Error('Draw.io bridge destroyed'));
    }

    pending.clear();
  }

  return {
    post,
    handleMessage,
    destroy,
    loadXml(xml) {
      return post('load', { xml });
    },
    getXml() {
      return post('export', { format: 'xml' }, 'export');
    },
    save() {
      return post('save', {}, 'save');
    },
    export(options = {}) {
      return post('export', options, 'export');
    },
    exportAs(format, options = {}) {
      return post('export', { ...options, format }, 'export');
    },
    setModified(modified) {
      return post('setModified', { modified: Boolean(modified) });
    },
    setReadOnly(readOnly) {
      return post('setReadOnly', { readOnly: Boolean(readOnly) });
    }
  };
}
