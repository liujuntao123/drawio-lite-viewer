import type { CSSProperties, ForwardRefExoticComponent, RefAttributes } from 'react';
import type {
  DrawioBridge,
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

export type DrawioReactMessageEvent = {
  message: DrawioRawMessage;
  event: MessageEvent;
};

export type DrawioEditorProps = {
  assetBase: string;
  value?: string;
  defaultValue?: string;
  mode?: DrawioMode;
  format?: DrawioFormat;
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
  className?: string;
  style?: CSSProperties;
  sandbox?: string;
  allowedOrigin?: string | string[] | URL;
  targetOrigin?: string;
  title?: string;
  onReady?: (api: DrawioEditorApi) => void;
  onLoad?: (event: DrawioRawMessage) => void;
  onChange?: (xml: string, event: DrawioRawMessage) => void;
  onSave?: (event: DrawioRawMessage) => void;
  onExport?: (event: DrawioExportResult) => void;
  onClose?: (event: DrawioRawMessage) => void;
  onError?: (error: DrawioRawMessage) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onMessage?: (event: DrawioReactMessageEvent) => void;
};

export const DrawioEditor: ForwardRefExoticComponent<
  DrawioEditorProps & RefAttributes<DrawioEditorApi>
>;

export type { DrawioBridge };
