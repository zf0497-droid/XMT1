/**
 * 画面比例与像素尺寸的单一数据源。
 *
 * - 下拉与编辑器：使用 ASPECT_RATIO_PRESETS（顺序即菜单顺序）。
 * - 未在表中登记的比例：只要是「正整数:正整数」字符串，仍可通过算法得到稳定、可编码的尺寸。
 * - 新增预设：只改 ASPECT_RATIO_PRESETS + 文案/图标映射；服务端无需再维护白名单。
 */

export interface CanvasDimensions {
  width: number;
  height: number;
}

/**
 * 成片编码：H.264 等要求宽高为偶数；与 Remotion validateEvenDimensions 一致。
 */
export function normalizeDimensionsForVideoEncode(
  width: number,
  height: number
): CanvasDimensions {
  const w = Math.max(2, Math.floor(width / 2) * 2);
  const h = Math.max(2, Math.floor(height / 2) * 2);
  return { width: w, height: h };
}

/** 预设 id 与像素（编辑器与导出默认使用表中值） */
export const ASPECT_RATIO_PRESETS = [
  { id: "16:9", width: 1280, height: 720 },
  { id: "4:3", width: 1440, height: 1080 },
  { id: "1:1", width: 1080, height: 1080 },
  { id: "4:5", width: 1080, height: 1350 },
  { id: "9:16", width: 1080, height: 1920 },
  { id: "3:4", width: 1080, height: 1440 },
] as const;

export type KnownAspectRatio = (typeof ASPECT_RATIO_PRESETS)[number]["id"];

/** 允许预设或任意「宽:高」字符串（如未来 21:9） */
export type AspectRatio = KnownAspectRatio | (string & {});

const PRESET_MAP = new Map<string, CanvasDimensions>(
  ASPECT_RATIO_PRESETS.map((p) => [p.id, { width: p.width, height: p.height }])
);

/** 算法推导时的长边像素，与 1080p 竖屏长边一致 */
const COMPUTED_LONG_EDGE = 1920;

export function parseAspectRatioString(input: string): { w: number; h: number } | null {
  const m = /^(\d+)\s*:\s*(\d+)$/.exec(String(input).trim());
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return { w, h };
}

function computeDimensionsFromRatioParts(wPart: number, hPart: number): CanvasDimensions {
  if (wPart >= hPart) {
    const width = COMPUTED_LONG_EDGE;
    const height = Math.round(COMPUTED_LONG_EDGE * (hPart / wPart));
    return normalizeDimensionsForVideoEncode(width, height);
  }
  const height = COMPUTED_LONG_EDGE;
  const width = Math.round(COMPUTED_LONG_EDGE * (wPart / hPart));
  return normalizeDimensionsForVideoEncode(width, height);
}

/**
 * 预设用表中像素；否则按「宽:高」比例推导并偶数对齐；非法则 1280×720。
 */
export function getDimensionsForAspectRatio(aspectRatio: string): CanvasDimensions {
  const preset = PRESET_MAP.get(aspectRatio);
  if (preset) {
    return { width: preset.width, height: preset.height };
  }
  const parts = parseAspectRatioString(aspectRatio);
  if (parts) {
    return computeDimensionsFromRatioParts(parts.w, parts.h);
  }
  return { width: 1280, height: 720 };
}

/** 将 "16:9" 等转为数值宽高比（宽/高）；无法解析时默认 16:9 */
export function aspectRatioToNumeric(ratio: string): number {
  const parts = parseAspectRatioString(ratio);
  if (parts) {
    return parts.w / parts.h;
  }
  return 16 / 9;
}

export function isValidAspectRatioString(s: string): boolean {
  return parseAspectRatioString(s) !== null;
}
