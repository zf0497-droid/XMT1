import {
  EDITOR_INITIAL_LOAD_SUBTITLE,
  EDITOR_INITIAL_LOAD_TITLE,
} from "./reactvideoeditor/pro/constants/editor-initial-load-copy";

/**
 * App Router 首屏/路由切换时的加载 UI（与 Editor 内自动保存检查文案一致）
 */
export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-background p-6">
      <div className="text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto mb-3" />
        <h3 className="text-lg font-extralight mb-2">
          {EDITOR_INITIAL_LOAD_TITLE}
        </h3>
        <p className="text-sm font-extralight">
          {EDITOR_INITIAL_LOAD_SUBTITLE}
        </p>
      </div>
    </div>
  );
}
