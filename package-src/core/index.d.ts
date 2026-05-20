export type DrawioMode = 'edit' | 'view';

export type DrawioFormat = 'xml' | 'xmlpng' | 'xmlsvg' | 'svg' | 'png' | 'pdf';

export type DrawioUrlParamValue = string | number | boolean | null | undefined;

export type DrawioConfig = Record<string, unknown>;

export type DrawioLocale = 'en' | 'zh' | 'zh-CN' | string;

export type DrawioLocaleMessages = {
  loading: string;
  error: string;
  ready: string;
  [key: string]: string;
};

export type DrawioLocaleMessageMap = Record<string, Partial<DrawioLocaleMessages>>;

export type ResolveLocaleOptions = {
  locale?: DrawioLocale;
  lang?: string;
  messages?: DrawioLocaleMessageMap;
};

export type ResolvedDrawioLocale = {
  locale: string;
  lang: string;
  messages: DrawioLocaleMessages;
};

export type BuildDrawioUrlOptions = {
  assetBase: string;
  mode?: DrawioMode;
  lang?: string;
  config?: DrawioConfig | null;
  urlParams?: Record<string, DrawioUrlParamValue>;
};

export type DrawioRawMessage = Record<string, unknown> & {
  event?: string;
  action?: string;
  id?: string;
  xml?: string;
  data?: unknown;
  raw?: unknown;
};

export type DrawioCommand = Record<string, unknown> & {
  action: string;
  id?: string;
};

export type DrawioExportOptions = {
  format: DrawioFormat;
  transparent?: boolean;
  scale?: number;
  border?: number;
};

export type DrawioExportResult = DrawioRawMessage & {
  data?: string;
  xml?: string;
};

export type DrawioBridgeOptions = {
  frame: HTMLIFrameElement | Window;
  targetOrigin?: string;
  allowedOrigin?: string | string[] | URL;
  timeoutMs?: number;
  onMessage?: (message: DrawioRawMessage, event: MessageEvent) => void;
};

export type DrawioBridge = {
  post(action: string, payload?: Record<string, unknown>, waitFor?: string): Promise<DrawioRawMessage>;
  handleMessage(event: MessageEvent): DrawioRawMessage | null;
  destroy(): void;
  loadXml(xml: string): Promise<DrawioRawMessage>;
  getXml(): Promise<DrawioRawMessage>;
  save(): Promise<DrawioRawMessage>;
  export(options: DrawioExportOptions): Promise<DrawioExportResult>;
  exportAs(format: DrawioFormat, options?: Omit<DrawioExportOptions, 'format'>): Promise<DrawioExportResult>;
  setModified(modified: boolean): Promise<DrawioRawMessage>;
  setReadOnly(readOnly: boolean): Promise<DrawioRawMessage>;
};

export const DEFAULT_LOCALE_MESSAGES: Record<string, DrawioLocaleMessages>;
export function buildDrawioUrl(options: BuildDrawioUrlOptions): string;
export function resolveLocale(options?: ResolveLocaleOptions): ResolvedDrawioLocale;
export function parseDrawioMessage(data: unknown): DrawioRawMessage | null;
export function isAllowedOrigin(origin: string, allowedOrigin?: string | string[] | URL): boolean;
export function createRequestId(prefix?: string): string;
export function createDebounced<T extends (...args: unknown[]) => void>(fn: T, delayMs?: number): T;
export function createDrawioBridge(options: DrawioBridgeOptions): DrawioBridge;
