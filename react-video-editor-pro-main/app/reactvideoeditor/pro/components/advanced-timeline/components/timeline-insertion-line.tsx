import React from 'react';
import { TIMELINE_CONSTANTS } from '../constants';

interface TimelineInsertionLineProps {
  /** 素材拖移等产生的插入位置（与 store 一致） */
  insertionIndex: number | null;
  trackCount: number;
  /**
   * 轨道重排时的插入间隙 0…trackCount（优先于 insertionIndex，避免与素材拖移指示冲突）
   */
  trackReorderGapIndex?: number | null;
}

/**
 * Timeline insertion line component that shows where a new track would be inserted
 */
export const TimelineInsertionLine: React.FC<TimelineInsertionLineProps> = ({
  insertionIndex,
  trackCount,
  trackReorderGapIndex,
}) => {
  // 轨道重排：全宽参考线在 timeline-tracks-wrapper 上绘制，此处不再重复
  if (trackReorderGapIndex != null) {
    return null;
  }

  if (insertionIndex === null) {
    return null;
  }

  return (
    <div
      className="absolute left-0 right-0 border-t-2 border-blue-500 pointer-events-none transition-[top] duration-75"
      style={
        insertionIndex === trackCount
          ? { bottom: 0, zIndex: 60 }
          : {
              // No MARKERS_HEIGHT offset needed - markers are now in a separate container
              top: `${insertionIndex * TIMELINE_CONSTANTS.TRACK_HEIGHT}px`,
              zIndex: 60,
            }
      }
    />
  );
};
