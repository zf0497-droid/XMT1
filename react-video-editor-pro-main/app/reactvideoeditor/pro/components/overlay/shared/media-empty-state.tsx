import { Search, AlertCircle } from "lucide-react";
import { t } from "../../../locales";

interface MediaEmptyStateProps {
  type: "no-adaptors" | "no-results" | "initial";
  mediaType: string; // e.g. "videos", "images", "templates"
  activeTabName?: string;
}

function getInitialCopy(mediaType: string): { line1: string; line2: string } {
  const m = mediaType.toLowerCase();
  if (m.includes("video")) {
    return {
      line1: t.media.emptySearchVideosLine1,
      line2: t.media.emptySearchVideosLine2,
    };
  }
  if (m.includes("image")) {
    return {
      line1: t.media.emptySearchImagesLine1,
      line2: t.media.emptySearchImagesLine2,
    };
  }
  if (m.includes("template")) {
    return {
      line1: t.media.emptySearchTemplatesLine1,
      line2: t.media.emptySearchTemplatesLine2,
    };
  }
  return {
    line1: t.media.emptySearchVideosLine1,
    line2: t.media.emptySearchVideosLine2,
  };
}

function typeLabel(mediaType: string): string {
  const m = mediaType.toLowerCase();
  if (m.includes("video")) return t.media.typeVideos;
  if (m.includes("image")) return t.media.typeImages;
  if (m.includes("template")) return t.media.typeTemplates;
  return mediaType;
}

/**
 * MediaEmptyState - Shared empty state component
 */
export const MediaEmptyState: React.FC<MediaEmptyStateProps> = ({
  type,
  mediaType,
  activeTabName,
}) => {
  if (type === "no-adaptors") {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-center">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>{t.media.emptyNoAdaptor.replace("{type}", typeLabel(mediaType))}</p>
      </div>
    );
  }

  if (type === "no-results") {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-center">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>
          {activeTabName
            ? `${t.media.emptyNoResults}（${activeTabName}）`
            : t.media.emptyNoResults}
        </p>
        <p className="text-sm mt-1">{t.media.tryDifferentSearch}</p>
      </div>
    );
  }

  const { line1, line2 } = getInitialCopy(mediaType);

  return (
    <div className="flex flex-col font-extralight items-center justify-center py-8 text-muted-foreground text-center">
      <Search className="h-8 w-8 mb-2" />
      <p className="text-sm text-center">{line1}</p>
      <p className="text-xs text-center mt-1">{line2}</p>
    </div>
  );
};
