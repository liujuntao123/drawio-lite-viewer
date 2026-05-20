import type { DefineComponent } from 'vue';
import type {
  DrawioCommand,
  DrawioConfig,
  DrawioExportOptions,
  DrawioExportResult,
  DrawioFormat,
  DrawioLocale,
  DrawioLocaleMessageMap,
  DrawioMode,
  DrawioRawMessage,
  DrawioUrlParamValue
} from '../core/index.js';

export type DrawioEditorApi = {
  loadXml(xml: string): Promise<DrawioRawMessage>;
  getXml(): Promise<string>;
  save(): Promise<string>;
  clear(): Promise<DrawioRawMessage>;
  export(options: DrawioExportOptions): Promise<DrawioExportResult>;
  exportAs(format: DrawioFormat, options?: Omit<DrawioExportOptions, 'format'>): Promise<DrawioExportResult>;
  setReadOnly(readOnly: boolean): Promise<DrawioRawMessage>;
  setModified(modified: boolean): Promise<DrawioRawMessage>;
  focus(): void;
  reload(): void;
  destroy(): void;
  send(command: DrawioCommand): Promise<DrawioRawMessage>;
};

export type DrawioVueMessageEvent = {
  message: DrawioRawMessage;
  event: MessageEvent;
};

export type DrawioEditorProps = {
  assetBase: string;
  modelValue?: string;
  defaultValue?: string;
  mode?: DrawioMode;
  lang?: string;
  locale?: DrawioLocale;
  messages?: DrawioLocaleMessageMap;
  config?: DrawioConfig | null;
  urlParams?: Record<string, DrawioUrlParamValue>;
  autosave?: boolean;
  changeDebounceMs?: number;
  readOnly?: boolean;
  width?: string | number;
  height?: string | number;
  iframeClass?: string;
  iframeStyle?: Record<string, string | number>;
  sandbox?: string;
  allowedOrigin?: string | string[] | URL;
  targetOrigin?: string;
  title?: string;
};

export const DrawioEditor: DefineComponent<DrawioEditorProps>;
export default DrawioEditor;
