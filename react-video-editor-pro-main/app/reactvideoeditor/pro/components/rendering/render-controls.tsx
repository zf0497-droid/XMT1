import React from "react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Bell, Download, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN as locale } from "date-fns/locale";
import { useEditorContext } from "../../contexts/editor-context";
import { t } from "../../locales";
import type { RenderQualityPreset } from "../../types/renderer";
import { cn } from "../../utils/general/utils";

/**
 * Interface representing a single video render attempt
 * @property {string} url - URL of the rendered video (if successful)
 * @property {Date} timestamp - When the render was completed
 * @property {string} id - Unique identifier for the render
 * @property {'success' | 'error'} status - Result of the render attempt
 * @property {string} error - Error message if render failed
 */
interface RenderItem {
  url?: string;
  timestamp: Date;
  id: string;
  status: "success" | "error";
  error?: string;
}

/**
 * Props for the RenderControls component
 * @property {object} state - Current render state containing status, progress, and URL
 * @property {() => void} handleRender - Function to trigger a new render
 */
interface RenderControlsProps {
  state: any;
  handleRender: (qualityPreset?: RenderQualityPreset) => void | Promise<void>;
}

/**
 * RenderControls component provides UI controls for video rendering functionality
 *
 * Features:
 * - Render button that shows progress during rendering
 * - Notification bell showing render history
 * - Download buttons for completed renders
 * - Error display for failed renders
 *
 * The component maintains a history of render attempts, both successful and failed,
 * and provides visual feedback about the current render status.
 */
const RenderControls: React.FC<RenderControlsProps> = ({
  state,
  handleRender,
}) => {
  // Get render type from editor context
  const { renderType } = useEditorContext();
  
  /**
   * 默认允许渲染（与 README 的 NEXT_PUBLIC_DISABLE_RENDER 一致）。
   * 仅当 NEXT_PUBLIC_DISABLE_RENDER=true 时禁用。
   * 兼容旧配置：NEXT_PUBLIC_RENDERING_ENABLED=false 时也会关闭。
   */
  const isRenderingEnabled =
    process.env.NEXT_PUBLIC_DISABLE_RENDER !== "true" &&
    process.env.NEXT_PUBLIC_RENDERING_ENABLED !== "false";
  
  // Store multiple renders
  const [renders, setRenders] = React.useState<RenderItem[]>([]);
  // Track if there are new renders
  const [hasNewRender, setHasNewRender] = React.useState(false);

  const [qualityDialogOpen, setQualityDialogOpen] = React.useState(false);
  const [selectedQuality, setSelectedQuality] =
    React.useState<RenderQualityPreset>("balanced");

  const qualityOptions: {
    id: RenderQualityPreset;
    title: string;
    desc: string;
    badge?: string;
  }[] = [
    {
      id: "fast",
      title: t.render.qualityFast,
      desc: t.render.qualityFastDesc,
    },
    {
      id: "balanced",
      title: t.render.qualityBalanced,
      desc: t.render.qualityBalancedDesc,
      badge: t.render.qualityRecommended,
    },
    {
      id: "high",
      title: t.render.qualityHigh,
      desc: t.render.qualityHighDesc,
    },
  ];

  const openQualityDialog = () => {
    if (!isRenderingEnabled) return;
    if (state.status === "rendering" || state.status === "invoking") return;
    setQualityDialogOpen(true);
  };

  const confirmRender = () => {
    setQualityDialogOpen(false);
    void handleRender(selectedQuality);
  };

  // Add new render to the list when completed
  React.useEffect(() => {
    if (state.status === "done") {
      setRenders((prev) => [
        {
          url: state.url,
          timestamp: new Date(),
          id: crypto.randomUUID(),
          status: "success",
        },
        ...prev,
      ]);
      setHasNewRender(true);
    } else if (state.status === "error") {
      setRenders((prev) => [
        {
          timestamp: new Date(),
          id: crypto.randomUUID(),
          status: "error",
          error:
            state.error?.message || t.render.failedToRender,
        },
        ...prev,
      ]);
      setHasNewRender(true);
    }
  }, [state.status, state.url, state.error]);

  const handleDownload = (url: string) => {
    let downloadUrl = url;

    if (renderType === "ssr") {
      // Convert the video URL to a download URL for SSR
      downloadUrl = url
        .replace("/rendered-videos/", "/api/latest/ssr/download/")
        .replace(".mp4", "");
    }
    // Lambda URLs are already in the correct format for download

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "rendered-video.mp4";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getDisplayFileName = (url: string) => {
    if (renderType === "ssr") {
      return url.split("/").pop();
    }
    // For Lambda URLs, use the full URL pathname
    try {
      return new URL(url).pathname.split("/").pop();
    } catch {
      return url.split("/").pop();
    }
  };

  return (
    <>
      <Popover onOpenChange={() => setHasNewRender(false)}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative hover:bg-accent text-foreground"
          >
            <Bell className="w-3.5 h-3.5" />
            {hasNewRender && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-3">
          <div className="space-y-1.5">
            <h4 className="text-sm font-extralight">{t.render.recentRenders}</h4>
            {renders.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t.render.noRenders}</p>
            ) : (
              renders.map((render) => (
                <div
                  key={render.id}
                  className={`flex items-center justify-between rounded-md border p-1.5 ${
                    render.status === "error"
                      ? "border-destructive/50 bg-destructive/10"
                      : "border-border"
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="text-xs text-primary">
                      {render.status === "error" ? (
                        <span className="text-red-400 font-extralight">
                          {t.render.renderError}
                        </span>
                      ) : (
                        getDisplayFileName(render.url!)
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(render.timestamp, {
                        addSuffix: true,
                        locale: locale,
                      })}
                      {render.error && (
                        <div
                          className="text-red-400 mt-0.5 truncate max-w-[180px]"
                          title={render.error}
                        >
                          {render.error}
                        </div>
                      )}
                    </div>
                  </div>
                  {render.status === "success" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-foreground hover:bg-accent h-6 w-6"
                      onClick={() => handleDownload(render.url!)}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={qualityDialogOpen} onOpenChange={setQualityDialogOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby="render-quality-desc">
          <DialogHeader>
            <DialogTitle className="font-light text-lg">
              {t.render.qualityTitle}
            </DialogTitle>
            <DialogDescription id="render-quality-desc" className="text-sm font-extralight">
              {t.render.qualityHint}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            {qualityOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedQuality(opt.id)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring",
                  selectedQuality === opt.id
                    ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                    : "border-border bg-background"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {opt.title}
                  </span>
                  {opt.badge && (
                    <span className="text-[10px] rounded-full bg-primary/20 px-2 py-0.5 text-primary">
                      {opt.badge}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground font-extralight leading-relaxed">
                  {opt.desc}
                </p>
              </button>
            ))}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setQualityDialogOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button type="button" onClick={confirmRender}>
              {t.render.startRender}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        onClick={openQualityDialog}
        size="sm"
        variant="outline"
        disabled={state.status === "rendering" || state.status === "invoking" || !isRenderingEnabled}
        className={`bg-gray-800 text-white border-gray-700 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 ${!isRenderingEnabled ? "cursor-not-allowed" : ""}`}
        title={!isRenderingEnabled ? t.render.renderingDisabled : undefined}
      >
        {!isRenderingEnabled ? (
          t.render.renderVideo
        ) : state.status === "rendering" ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            {t.render.rendering} {(state.progress * 100).toFixed(0)}%
          </>
        ) : state.status === "invoking" ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            {t.render.preparing}
          </>
        ) : (
          t.render.renderVideo
        )}
      </Button>
    </>
  );
};

export default RenderControls;
