import React, { useRef, useCallback, useState } from 'react';
import { TimelineTrack as TimelineTrackType, TrackItemType } from '../types';
import { TIMELINE_CONSTANTS } from '../constants';
import {
  GripVertical,
  Trash2,
  Magnet,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { t } from '../../../locales';
import { cn } from '../../../utils/general/utils';
import {
  insertionGapToSpliceIndex,
  rowDragOverToInsertionGap,
} from '../utils/track-reorder-utils';
import useTimelineStore from '../stores/use-timeline-store';

interface TimelineTrackHandlesProps {
  tracks: TimelineTrackType[];
  onTrackReorder?: (fromIndex: number, toIndex: number) => void;
  onTrackDelete?: (trackId: string) => void;
  onToggleMagnetic?: (trackId: string) => void;
  onToggleTrackVisible?: (trackId: string) => void;
  onToggleTrackMuted?: (trackId: string) => void;
  enableTrackDrag?: boolean;
  enableMagneticTrack?: boolean;
  enableTrackDelete?: boolean;
}

/** 行内是否有可混音素材（视频 / 音频）— 无则第三列占位，保证磁铁/删除纵向对齐 */
function trackHasAudioContent(track: TimelineTrackType): boolean {
  if (track.items.length === 0) return false;
  return track.items.some(
    (i) =>
      i.type === TrackItemType.VIDEO ||
      i.type === TrackItemType.AUDIO ||
      i.type === 'video' ||
      i.type === 'audio'
  );
}

/** 拖拽 / 眼睛 / 喇叭 / 磁铁：圆形浅灰底 + 悬停立即轻微放大 */
const TOOL_HOVER =
  'inline-flex size-7 shrink-0 items-center justify-center rounded-full mx-auto ' +
  'transition-all duration-100 ease-out text-muted-foreground ' +
  'hover:bg-muted/85 hover:text-foreground hover:scale-110 hover:z-10 ' +
  'active:scale-100';

const HOVER_DANGER =
  'transition-all duration-100 ease-out text-muted-foreground rounded-full ' +
  'hover:bg-[hsl(var(--destructive)/0.12)] hover:text-destructive hover:scale-110 active:scale-100';

export const TimelineTrackHandles: React.FC<TimelineTrackHandlesProps> = ({
  tracks,
  onTrackReorder,
  onTrackDelete,
  onToggleMagnetic,
  onToggleTrackVisible,
  onToggleTrackMuted,
}) => {
  const dragIndexRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    dragIndexRef.current = index;
    setIsDragging(true);
    useTimelineStore.getState().beginTrackReorder(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback((index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
    const src = dragIndexRef.current;
    if (src !== null) {
      const rect = e.currentTarget.getBoundingClientRect();
      const gap = rowDragOverToInsertionGap(e.clientY, rect, index, tracks.length);
      useTimelineStore.getState().updateTrackReorderPreview(index, gap);
    }
  }, [tracks.length]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((toIndex: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fromIndex = dragIndexRef.current ?? parseInt(e.dataTransfer.getData('text/plain'), 10);
    const rect = e.currentTarget.getBoundingClientRect();
    const gap = rowDragOverToInsertionGap(e.clientY, rect, toIndex, tracks.length);
    const to = insertionGapToSpliceIndex(fromIndex, gap, tracks.length);
    if (!Number.isNaN(fromIndex) && fromIndex !== to) {
      onTrackReorder?.(fromIndex, to);
    }
    dragIndexRef.current = null;
    setIsDragging(false);
    setDragOverIndex(null);
    useTimelineStore.getState().endTrackReorder();
  }, [onTrackReorder, tracks.length]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragOverIndex(null);
    dragIndexRef.current = null;
    useTimelineStore.getState().endTrackReorder();
  }, []);

  return (
    <div 
      className="flex flex-col h-full bg-background border-r border-border border-l overflow-hidden"
      style={{ 
        width: `${TIMELINE_CONSTANTS.HANDLE_WIDTH}px`,
      }}
    >
      <div 
        className="flex-shrink-0 bg-background border-b border-border"
        style={{ height: `${TIMELINE_CONSTANTS.MARKERS_HEIGHT}px` }}
      />
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide track-handles-scroll">
        {tracks.map((track, index) => {
          const isBeingDragged = isDragging && dragIndexRef.current === index;
          const isDropTarget = dragOverIndex === index && dragIndexRef.current !== index;
          const showSpeaker = trackHasAudioContent(track);
          const isHidden = track.visible === false;
          const isMuted = track.muted === true;
          
          const getTrackClasses = () => {
            const baseClasses = "track grid grid-cols-5 gap-x-0.5 items-center px-1 border-border w-full min-w-0";
            
            if (isBeingDragged) {
              return `${baseClasses} relative z-[100] bg-muted/95 border-l-2 border-l-primary shadow-lg ring-1 ring-primary/40 scale-[1.02] transition-none`;
            } else if (isDropTarget) {
              return `${baseClasses} bg-[hsl(var(--primary)/0.1)]  border-l-[2px] border-l-primary scale-102`;
            } else if (isDragging) {
              return `${baseClasses} bg-background opacity-70`;
            }
            
            return `${baseClasses} bg-background`;
          };
          
          return (
            <div
              key={track.id}
              className={`${getTrackClasses()} overflow-visible`}
              style={{ 
                height: `${TIMELINE_CONSTANTS.TRACK_HEIGHT}px`
              }}
              onDragOver={handleDragOver(index)}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop(index)}
            >
              {/* 列1：拖拽 */}
              <div
                className={cn(
                  TOOL_HOVER,
                  'select-none',
                  isBeingDragged
                    ? '!transition-none scale-100 cursor-grabbing ring-2 ring-primary/60 shadow-md bg-muted'
                    : 'cursor-grab'
                )}
                draggable
                onDragStart={handleDragStart(index)}
                onDragEnd={handleDragEnd}
                title={t.timeline.reorderTrack}
              >
                <GripVertical className={cn('w-3 h-3', isBeingDragged ? 'text-primary' : '')} />
              </div>

              {/* 列2：显示/隐藏 */}
              <button
                type="button"
                className={cn(
                  TOOL_HOVER,
                  isHidden && 'opacity-60'
                )}
                onClick={() => onToggleTrackVisible?.(track.id)}
                title={isHidden ? t.timeline.showTrack : t.timeline.hideTrack}
              >
                {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>

              {/* 列3：静音（无音频轨时占位，保证后两列对齐） */}
              <div className="flex h-7 w-full min-w-0 max-w-[1.75rem] mx-auto items-center justify-center">
                {showSpeaker ? (
                  <button
                    type="button"
                    className={cn(
                      TOOL_HOVER,
                      isMuted && 'text-amber-500 hover:text-amber-400'
                    )}
                    onClick={() => onToggleTrackMuted?.(track.id)}
                    title={isMuted ? t.timeline.unmuteTrack : t.timeline.muteTrack}
                  >
                    {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  </button>
                ) : (
                  <span className="block h-7 w-7 shrink-0" aria-hidden />
                )}
              </div>

              {/* 列4：磁性 */}
              <button
                type="button"
                className={cn(
                  TOOL_HOVER,
                  track.magnetic &&
                    'text-warning bg-[hsl(var(--warning)/0.12)] border border-[hsl(var(--warning)/0.35)] hover:bg-[hsl(var(--warning)/0.22)] hover:text-warning'
                )}
                onClick={() => onToggleMagnetic?.(track.id)}
                title={track.magnetic ? t.timeline.disableMagnetic : t.timeline.enableMagnetic}
              >
                <Magnet className="w-3 h-3" />
              </button>

              {/* 列5：删除 */}
              <button
                type="button"
                className={cn(
                  'inline-flex size-7 shrink-0 items-center justify-center mx-auto',
                  HOVER_DANGER
                )}
                onClick={() => onTrackDelete?.(track.id)}
                title={t.timeline.deleteTrack}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
