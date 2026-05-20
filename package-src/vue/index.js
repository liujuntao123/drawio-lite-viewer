import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  ref,
  watch
} from 'vue';

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

export const DrawioEditor = defineComponent({
  name: 'DrawioEditor',
  props: {
    assetBase: { type: String, required: true },
    modelValue: { type: String, default: undefined },
    defaultValue: { type: String, default: undefined },
    mode: { type: String, default: 'edit' },
    lang: { type: String, default: undefined },
    locale: { type: String, default: undefined },
    messages: { type: Object, default: undefined },
    config: { type: Object, default: undefined },
    urlParams: { type: Object, default: undefined },
    autosave: { type: Boolean, default: false },
    changeDebounceMs: { type: Number, default: 300 },
    readOnly: { type: Boolean, default: false },
    width: { type: [String, Number], default: '100%' },
    height: { type: [String, Number], default: '100%' },
    iframeClass: { type: String, default: undefined },
    iframeStyle: { type: Object, default: undefined },
    sandbox: {
      type: String,
      default: 'allow-scripts allow-same-origin allow-forms allow-popups allow-downloads'
    },
    allowedOrigin: { type: [String, Array, URL], default: '*' },
    targetOrigin: { type: String, default: '*' },
    title: { type: String, default: 'draw.io editor' }
  },
  emits: [
    'ready',
    'load',
    'change',
    'update:modelValue',
    'save',
    'export',
    'close',
    'error',
    'dirty-change',
    'message'
  ],
  setup(props, { emit, expose }) {
    const iframeRef = ref(null);
    const bridgeRef = ref(null);
    const latestValue = ref(props.modelValue);
    const resolvedLocale = computed(() => resolveLocale({
      locale: props.locale || props.lang || 'en',
      lang: props.lang,
      messages: props.messages
    }));

    const src = computed(() => buildDrawioUrl({
      assetBase: props.assetBase,
      mode: props.mode,
      lang: resolvedLocale.value.lang,
      config: props.config,
      urlParams: props.urlParams
    }));

    const api = {
      loadXml(xml) {
        return bridgeRef.value?.loadXml(xml) || Promise.reject(new Error('Draw.io editor is not ready'));
      },
      async getXml() {
        const message = await bridgeRef.value?.getXml();
        return message?.xml || message?.data || '';
      },
      async save() {
        const message = await bridgeRef.value?.save();
        return message?.xml || message?.data || '';
      },
      clear() {
        return bridgeRef.value?.loadXml('') || Promise.reject(new Error('Draw.io editor is not ready'));
      },
      export(options) {
        return bridgeRef.value?.export(options) || Promise.reject(new Error('Draw.io editor is not ready'));
      },
      exportAs(format, options) {
        return bridgeRef.value?.exportAs(format, options) || Promise.reject(new Error('Draw.io editor is not ready'));
      },
      setReadOnly(readOnly) {
        return bridgeRef.value?.setReadOnly(readOnly) || Promise.reject(new Error('Draw.io editor is not ready'));
      },
      setModified(modified) {
        return bridgeRef.value?.setModified(modified) || Promise.reject(new Error('Draw.io editor is not ready'));
      },
      focus() {
        iframeRef.value?.focus();
      },
      reload() {
        if (iframeRef.value != null) {
          iframeRef.value.src = src.value;
        }
      },
      destroy() {
        bridgeRef.value?.destroy();
        bridgeRef.value = null;
      },
      send(command) {
        return bridgeRef.value?.post(command.action, command) || Promise.reject(new Error('Draw.io editor is not ready'));
      }
    };

    expose(api);

    function attachBridge() {
      if (iframeRef.value == null || bridgeRef.value != null) {
        return;
      }

      const emitChange = createDebounced((xml, message) => {
        emit('update:modelValue', xml);
        emit('change', xml, message);
      }, props.changeDebounceMs);

      const bridge = createDrawioBridge({
        frame: iframeRef.value,
        targetOrigin: props.targetOrigin,
        allowedOrigin: props.allowedOrigin,
        onMessage(message, event) {
          emit('message', { message, event });

          switch (message.event || message.action) {
            case 'configure':
              if (props.config != null) {
                bridge.post('configure', { config: props.config });
              }
              break;
            case 'init':
            case 'ready': {
              const initialXml = latestValue.value ?? props.defaultValue;

              if (initialXml != null) {
                bridge.loadXml(initialXml);
              }

              if (props.readOnly) {
                bridge.setReadOnly(true);
              }

              emit('ready', api);
              break;
            }
            case 'load':
              emit('load', message);
              break;
            case 'autosave':
            case 'change':
              if (props.autosave || message.event === 'change') {
                emitChange(message.xml || message.data || '', message);
              }
              break;
            case 'save':
              emit('save', message);
              break;
            case 'export':
              emit('export', message);
              break;
            case 'exit':
            case 'close':
              emit('close', message);
              break;
            case 'error':
              emit('error', message);
              break;
            case 'dirty':
            case 'modified':
              emit('dirty-change', Boolean(message.modified ?? message.dirty));
              break;
            default:
              break;
          }
        }
      });

      bridgeRef.value = bridge;
      window.addEventListener('message', bridge.handleMessage);
    }

    watch(() => props.modelValue, (nextValue) => {
      if (nextValue !== undefined && nextValue !== latestValue.value) {
        latestValue.value = nextValue;
        bridgeRef.value?.loadXml(nextValue);
      }
    });

    watch(src, () => {
      if (bridgeRef.value != null) {
        window.removeEventListener('message', bridgeRef.value.handleMessage);
      }

      api.destroy();
    });

    onBeforeUnmount(() => {
      if (bridgeRef.value != null) {
        window.removeEventListener('message', bridgeRef.value.handleMessage);
      }

      api.destroy();
    });

    return () => h('iframe', {
      ref: (el) => {
        iframeRef.value = el;
        attachBridge();
      },
      src: src.value,
      title: props.title,
      'aria-label': resolvedLocale.value.messages.ready,
      class: props.iframeClass,
      sandbox: props.sandbox,
      style: {
        width: resolveSize(props.width, '100%'),
        height: resolveSize(props.height, '100%'),
        border: 0,
        display: 'block',
        ...props.iframeStyle
      }
    });
  }
});

export default DrawioEditor;
