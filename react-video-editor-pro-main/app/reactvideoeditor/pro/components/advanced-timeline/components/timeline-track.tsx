import React, { useCallback } from 'react';
import { cn } from '../../../utils/general/utils';
import { TimelineTrack as TimelineTrackType, TimelineItem as TimelineItemType } from '../types';
import { TimelineItem } from './timeline-item';
import { TimelineGhostElement } from './timeline-ghost-element';
import { TimelineGapIndicator } from './timeline-gap-indicator';
import { findGapsInTrack } from '../utils/gap-utils';
import { rowDragOverToInsertionGap } from '../utils/track-reorder-utils';
import { TIMELINE_CONSTANTS } from '../constants';
import useTimelineStore from '../stores/use-timeline-store';
import { useShallow } from 'zustand/react/shallow';

interface TimelineTrackProps {
  track: TimelineTrackType;
  totalDuration: number;
  trackIndex: number;
  trackCount: number;
  onItemSelect?: (itemId: string) => void;
  onDeleteItems?: (itemIds: string[]) => void; // Updated to take array of item IDs
  onDuplicateItems?: (itemIds: string[]) => void; // Updated to take array of item IDs
  onSplitItems?: (itemId: string, splitTime: number) => void; // Callback when item should be split
  selectedItemIds?: string[]; // Currently selected item IDs (supports multiple)
  onSelectedItemsChange?: (itemIds: string[]) => void; // Callback when selection changes
  onItemMove?: (itemId: string, newStart: number, newEnd: number, newTrackId: string) => void;
  onDragStart?: (
    item: TimelineItemType,
    clientX: number,
    clientY: number,
    action: "move" | "resize-start" | "resize-end",
    selectedItemIds?: string[] // Add selectedItemIds parameter
  ) => void;
  zoomScale?: number;
  isDragging?: boolean;
  draggedItemId?: string;
  ghostElements?: Array<{
    left: number;
    width: number;
    top: number;
  }>;
  isValidDrop?: boolean;
  onContextMenuOpenChange?: (isOpen: boolean) => void; // New prop for context menu state
  splittingEnabled?: boolean; // Whether splitting mode is enabled
  hideItemsOnDrag?: boolean; // Whether to hide selected timeline items during drag operations (default: false)
  currentFrame?: number; // Current playhead frame position
  fps?: number; // Frames per second for time conversion
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({
  track,
  totalDuration,
  trackIndex,
  trackCount,
  onItemSelect,
  onDeleteItems,
  onDuplicateItems,
  onSplitItems,
  selectedItemIds = [],
  onSelectedItemsChange,
  onItemMove,
  onDragStart,
  zoomScale = 1,
  isDragging = false,
  draggedItemId,
  ghostElements = [],
  isValidDrop = false,
  onContextMenuOpenChange,
  splittingEnabled = false,
  hideItemsOnDrag = false,
  currentFrame,
  fps = 30,
}) => {
  const { magneticPreview } = useTimelineStore();

  const reorderUi = useTimelineStore(
    useShallow(
      useCallback((s) => {
        const src = s.trackReorderSourceIndex;
        const hov = s.trackReorderHoverIndex;
        const isSource = src === trackIndex;
        const isHover = hov === trackIndex;
        return {
          showReorderChrome: src !== null && (isSource || isHover),
          isReorderSource: isSource,
          isReorderHover: isHover,
        };
      }, [trackIndex])
    )
  );
  const { showReorderChrome, isReorderSource, isReorderHover } = reorderUi;

  // Find gaps in the track for gap indicators
  const gaps = findGapsInTrack(track.items);

  // Handle item selection change with support for multi-selection
  const handleSelectionChange = (itemId: string, isMultiple: boolean) => {
    if (onSelectedItemsChange) {
      if (isMultiple) {
        // Multi-selection: toggle the item
        const currentlySelected = selectedItemIds.includes(itemId);
        if (currentlySelected) {
          // Remove from selection
          const newSelection = selectedItemIds.filter(id => id !== itemId);
          onSelectedItemsChange(newSelection);
        } else {
          // Add to selection
          const newSelection = [...selectedItemIds, itemId];
          onSelectedItemsChange(newSelection);
        }
      } else {
        // Single selection: replace current selection
        onSelectedItemsChange([itemId]);
      }
    } else {
      // Fallback to old behavior
      onItemSelect?.(itemId);
    }
  };

  // Determine which items to render and their positions
  const shouldShowPreview = magneticPreview && magneticPreview.trackId === track.id && isDragging;

  const trackHidden = track.visible === false;

  const handleTrackReorderDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (useTimelineStore.getState().trackReorderSourceIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const gap = rowDragOverToInsertionGap(e.clientY, rect, trackIndex, trackCount);
    useTimelineStore.getState().updateTrackReorderPreview(trackIndex, gap);
  };

  return (
    <div 
      className={cn(
        'track relative w-full border-b border-(--border)',
        'bg-(--timeline-row) transition-all duration-200 ease-in-out',
        trackHidden && 'opacity-40',
        showReorderChrome && 'z-[90] isolate'
      )}
      style={{ 
        height: `${TIMELINE_CONSTANTS.TRACK_HEIGHT}px`,
      }}
      onDragOver={handleTrackReorderDragOver}
    >
      {shouldShowPreview ? (
        // Render preview items with shifted positions
        magneticPreview.previewItems.map((previewItem) => {
          const originalItem = track.items.find(item => item.id === previewItem.id);
          if (!originalItem) return null;
          
          return (
            <TimelineItem
              key={previewItem.id}
              item={{
                ...originalItem,
                start: previewItem.start,
                end: previewItem.end
              }}
              totalDuration={totalDuration}
              onSelect={onItemSelect}
              onSelectionChange={handleSelectionChange}
              onDragStart={onDragStart}
              onDeleteItems={onDeleteItems}
              onDuplicateItems={onDuplicateItems}
              onSplitItems={onSplitItems}
              selectedItemIds={selectedItemIds}
              zoomScale={zoomScale}
              isDragging={isDragging && draggedItemId === previewItem.id}
              isSelected={selectedItemIds?.includes(previewItem.id)}
              onContextMenuOpenChange={onContextMenuOpenChange}
              splittingEnabled={splittingEnabled}
              currentFrame={currentFrame}
              fps={fps}
            />
          );
        })
      ) : (
        // Render normal items
        track.items.map((item) => {
          // Check if this specific item should be hidden during drag
          const shouldHideThisItem = hideItemsOnDrag && isDragging && selectedItemIds?.includes(item.id);
          
          // Skip rendering this item if it should be hidden
          if (shouldHideThisItem) {
            return null;
          }
          
          return (
            <TimelineItem
              key={item.id}
              item={item}
              totalDuration={totalDuration}
              onSelect={onItemSelect}
              onSelectionChange={handleSelectionChange}
              onDragStart={onDragStart}
              onDeleteItems={onDeleteItems}
              onDuplicateItems={onDuplicateItems}
              onSplitItems={onSplitItems}
              selectedItemIds={selectedItemIds}
              zoomScale={zoomScale}
              isDragging={isDragging && draggedItemId === item.id}
              isSelected={selectedItemIds?.includes(item.id)}
              onContextMenuOpenChange={onContextMenuOpenChange}
              splittingEnabled={splittingEnabled}
              currentFrame={currentFrame}
              fps={fps}
            />
          );
        })
      )}
      
      {/* Gap indicators - only show when not dragging AND track is not magnetic */}
      {!isDragging && !track.magnetic &&
        gaps.map((gap, gapIndex) => (
          <TimelineGapIndicator
            key={`gap-${track.id}-${gapIndex}`}
            gap={gap}
            trackIndex={trackIndex}
            totalDuration={totalDuration}
            trackItems={track.items}
            onItemMove={onItemMove}
            trackId={track.id}
          />
        ))}
      
      {/* Ghost elements for this track */}
      {ghostElements.map((ghostElement, ghostIndex) => (
        <TimelineGhostElement
          key={`ghost-${trackIndex}-${ghostIndex}`}
          ghostElement={ghostElement}
          rowIndex={trackIndex}
          trackCount={trackCount}
          isValidDrop={isValidDrop}
          isFloating={false}
        />
      ))}

      {/* 盖在片段之上：ring/背景画在轨道层会被不透明 clip 挡住，必须用顶层 overlay */}
      {showReorderChrome && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-[200]',
            isReorderSource &&
              isReorderHover &&
              'bg-primary/35 shadow-[inset_0_0_0_4px_hsl(var(--primary)),0_12px_36px_-8px_rgba(0,0,0,0.55)]',
            isReorderSource &&
              !isReorderHover &&
              'bg-primary/22 shadow-[inset_0_0_0_3px_hsl(var(--primary)/0.9),0_8px_24px_-6px_rgba(0,0,0,0.45)]',
            !isReorderSource &&
              isReorderHover &&
              'bg-[hsl(var(--primary)/0.32)] shadow-[inset_0_0_0_4px_hsl(var(--primary)),0_0_28px_-2px_hsl(var(--primary)/0.55)]'
          )}
          aria-hidden
        />
      )}
    </div>
  );
};