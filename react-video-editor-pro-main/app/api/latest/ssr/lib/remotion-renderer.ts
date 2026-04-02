import { bundle } from "@remotion/bundler";
import {
  renderMedia,
  selectComposition,
  RenderMediaOnProgress,
} from "@remotion/renderer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

import {
  saveRenderState,
  updateRenderProgress,
  completeRender,
  failRender,
} from "./render-state";
import { getBaseUrl } from "../../../../reactvideoeditor/pro/utils/general/url-helper";
import type { RenderQualityPreset } from "../../../../reactvideoeditor/pro/types/renderer";
import type { X264Preset } from "@remotion/renderer";

// Ensure the videos directory exists
const VIDEOS_DIR = path.join(process.cwd(), "public", "rendered-videos");
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

/** 首次 bundle 很慢；缓存在进程内，避免每次点击渲染都重新 Webpack */
let cachedBundleLocation: string | null = null;
let bundleInFlight: Promise<string> | null = null;

async function getOrCreateBundleLocation(): Promise<string> {
  if (cachedBundleLocation) {
    return cachedBundleLocation;
  }
  if (!bundleInFlight) {
    bundleInFlight = bundle(
      path.join(
        process.cwd(),
        "app",
        "reactvideoeditor",
        "pro",
        "utils",
        "remotion",
        "index.ts"
      ),
      undefined,
      {
        webpackOverride: (config) => ({
          ...config,
          resolve: {
            ...config.resolve,
            fallback: {
              ...config.resolve?.fallback,
              "@remotion/compositor": false,
              "@remotion/compositor-darwin-arm64": false,
              "@remotion/compositor-darwin-x64": false,
              "@remotion/compositor-linux-x64": false,
              "@remotion/compositor-linux-arm64": false,
              "@remotion/compositor-win32-x64-msvc": false,
              "@remotion/compositor-windows-x64": false,
            },
          },
        }),
      }
    )
      .then((loc) => {
        cachedBundleLocation = loc;
        bundleInFlight = null;
        console.log("[Remotion SSR] Bundle cached at:", loc);
        return loc;
      })
      .catch((err) => {
        bundleInFlight = null;
        throw err;
      });
  }
  return bundleInFlight;
}

/**
 * 与用户界面三档画质对应（见 RenderControls 弹窗）。
 * 使用 videoBitrate 而非 crf，才能在 macOS 上让 Remotion 选用 h264_videotoolbox（Apple/Intel 均走系统编码器）。
 * Windows/Linux 在本依赖版本里 h264 仍为 libx264（CPU）；x264Preset 仅作用于该软件路径。
 */
function getPresetRow(preset: RenderQualityPreset | undefined) {
  const key = preset ?? "balanced";
  const table: Record<
    RenderQualityPreset,
    {
      baseBitrateMbps: number;
      x264Preset: X264Preset;
      imageFormat: "jpeg" | "png";
      jpegQuality: number;
    }
  > = {
    fast: {
      baseBitrateMbps: 8,
      x264Preset: "fast",
      imageFormat: "jpeg",
      jpegQuality: 82,
    },
    balanced: {
      baseBitrateMbps: 12,
      x264Preset: "medium",
      imageFormat: "jpeg",
      jpegQuality: 88,
    },
    high: {
      baseBitrateMbps: 22,
      x264Preset: "slow",
      imageFormat: "jpeg",
      jpegQuality: 92,
    },
  };
  return table[key];
}

/** 按分辨率相对 1080p 缩放码率，避免 4K 等分辨率下码率不足 */
function videoBitrateForResolution(
  baseMbps: number,
  width: number,
  height: number
): string {
  const factor = Math.sqrt((width * height) / (1920 * 1080));
  const mbps = Math.max(2, Math.round(baseMbps * factor));
  return `${mbps}M`;
}

/** 打包/选片阶段占进度条前 18%，编码占 82%（避免长时间卡在 0%） */
const PROGRESS_AFTER_BUNDLE = 0.1;
const PROGRESS_AFTER_SELECT = 0.18;
const ENCODE_WEIGHT = 1 - PROGRESS_AFTER_SELECT;

// Track rendering progress
export const renderProgress = new Map<string, number>();
export const renderStatus = new Map<string, "rendering" | "done" | "error">();
export const renderErrors = new Map<string, string>();
export const renderUrls = new Map<string, string>();
export const renderSizes = new Map<string, number>();

/**
 * Custom renderer that uses browser-based rendering to avoid platform-specific dependencies
 */
export async function startRendering(
  compositionId: string,
  inputProps: Record<string, unknown>,
  qualityPreset?: RenderQualityPreset
) {
  const renderId = uuidv4();

  // Initialize render state
  saveRenderState(renderId, {
    status: "rendering",
    progress: 0,
    timestamp: Date.now(),
  });

  // Start rendering asynchronously
  (async () => {
    try {
      updateRenderProgress(renderId, 0.02);

      // Get the base URL for serving media files
      const baseUrl = getBaseUrl();

      /** Main 组件在 SSR 下仍需要这些字段；与 root 默认 props 对齐，避免 undefined 崩溃 */
      const mergedInputProps = {
        setSelectedOverlayId: () => {},
        changeOverlay: () => {},
        selectedOverlayId: null as number | null,
        ...inputProps,
        baseUrl,
      };

      console.log(
        `[Remotion SSR] ${renderId} bundling (cached=${Boolean(cachedBundleLocation)})...`
      );
      const bundleLocation = await getOrCreateBundleLocation();
      updateRenderProgress(renderId, PROGRESS_AFTER_BUNDLE);

      // Select the composition
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: compositionId,
        inputProps: mergedInputProps,
      });
      updateRenderProgress(renderId, PROGRESS_AFTER_SELECT);

      const row = getPresetRow(qualityPreset);

      // Get the actual duration from inputProps or use composition's duration
      const actualDurationInFrames =
        (inputProps.durationInFrames as number) || composition.durationInFrames;
      
      // Get the actual dimensions from inputProps or use composition's dimensions
      const actualWidth = (inputProps.width as number) || composition.width;
      const actualHeight = (inputProps.height as number) || composition.height;

      const videoBitrate = videoBitrateForResolution(
        row.baseBitrateMbps,
        actualWidth,
        actualHeight
      );
      // macOS 硬件编码器不接受 x264 的 -preset；非 darwin 仍用 libx264 + preset 控制速度/体积
      const x264Preset =
        process.platform === "darwin" ? null : row.x264Preset;
      
      console.log(`Using actual duration: ${actualDurationInFrames} frames`);
      console.log(`Using actual dimensions: ${actualWidth}x${actualHeight}`);
      console.log(
        `[Remotion SSR] Encode: videoBitrate=${videoBitrate} x264Preset=${x264Preset ?? "(darwin HW / default)"} imageFormat=${row.imageFormat} hardwareAcceleration=if-possible`
      );

      // Render the video using chromium
      await renderMedia({
        codec: "h264",
        composition: {
          ...composition,
          // Override the duration to use the actual duration from inputProps
          durationInFrames: actualDurationInFrames,
          // Override the dimensions to use the actual dimensions from inputProps
          width: actualWidth,
          height: actualHeight,
        },
        serveUrl: bundleLocation,
        outputLocation: path.join(VIDEOS_DIR, `${renderId}.mp4`),
        inputProps: mergedInputProps,
        chromiumOptions: {
          headless: true,
          disableWebSecurity: false,
          ignoreCertificateErrors: false,
        },
        timeoutInMilliseconds: 300000, // 5 minutes
        onProgress: ((progress) => {
          const p = Math.min(
            1,
            PROGRESS_AFTER_SELECT + progress.progress * ENCODE_WEIGHT
          );
          updateRenderProgress(renderId, p);
        }) as RenderMediaOnProgress,
        // 不传 crf：与 videoBitrate 二选一；且 CRF 会阻止 macOS VideoToolbox
        videoBitrate,
        imageFormat: row.imageFormat,
        colorSpace: "bt709",
        x264Preset,
        hardwareAcceleration: "if-possible",
        ...(row.imageFormat === "jpeg"
          ? { jpegQuality: row.jpegQuality }
          : {}),
      });

      // Get file size
      const stats = fs.statSync(path.join(VIDEOS_DIR, `${renderId}.mp4`));
      const outputPath = `/rendered-videos/${renderId}.mp4`;
      completeRender(renderId, outputPath, stats.size);
      console.log(`Render ${renderId} completed successfully`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error);
      failRender(renderId, message);
      console.error(`Render ${renderId} failed:`, error);
    }
  })();

  return renderId;
}

/**
 * Get the current progress of a render
 */
export function getRenderProgress(renderId: string) {
  // Add logging to debug missing renders
  console.log("Checking progress for render:", renderId);
  console.log("Available render IDs:", Array.from(renderStatus.keys()));

  const progress = renderProgress.get(renderId) || 0;
  const status = renderStatus.get(renderId) || "rendering";
  const error = renderErrors.get(renderId);
  const url = renderUrls.get(renderId);
  const size = renderSizes.get(renderId);

  if (!renderStatus.has(renderId)) {
    throw new Error(`No render found with ID: ${renderId}`);
  }

  return {
    renderId,
    progress,
    status,
    error,
    url,
    size,
  };
}
