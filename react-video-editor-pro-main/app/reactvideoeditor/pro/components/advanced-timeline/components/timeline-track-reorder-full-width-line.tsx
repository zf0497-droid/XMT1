import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useTimelineStore from '../stores/use-timeline-store';
import { TIMELINE_CONSTANTS } from '../constants';

/**
 * 轨道重排时横跨「左侧手柄 + 右侧时间轴」的插入参考线，与单行内的线同一套 gap 坐标（相对滚动内容顶部）。
 */
export const TimelineTrackReorderFullWidthLine: React.FC<{ trackCount: number }> = ({
  trackCount,
}) => {
  const { sourceIndex, gapIndex } = useTimelineStore(
    useShallow((s) => ({
      sourceIndex: s.trackReorderSourceIndex,
      gapIndex: s.trackReorderGapIndex,
    }))
  );

  const [lineTop, setLineTop] = useState<number | null>(null);

  const computeTop = useCallback((): number | null => {
    const { trackReorderSourceIndex: src, trackReorderGapIndex: gap } =
      useTimelineStore.getState();
    if (src === null || gap === null || trackCount <= 0) return null;

    const wrapper = document.querySelector('.timeline-tracks-wrapper') as HTMLElement | null;
    const scrollEl = document.querySelector(
      '.timeline-tracks-scroll-container'
    ) as HTMLElement | null;
    if (!wrapper || !scrollEl) return null;

    const wrapRect = wrapper.getBoundingClientRect();
    const scrollRect = scrollEl.getBoundingClientRect();
    const h = TIMELINE_CONSTANTS.TRACK_HEIGHT;
    const yInScrollContent = gap * h - scrollEl.scrollTop;
    return scrollRect.top - wrapRect.top + yInScrollContent;
  }, [trackCount]);

  useLayoutEffect(() => {
    if (sourceIndex === null || gapIndex === null) {
      setLineTop(null);
      return;
    }
    setLineTop(computeTop());
  }, [sourceIndex, gapIndex, trackCount, computeTop]);

  useEffect(() => {
    if (sourceIndex === null) return;

    const scrollEl = document.querySelector(
      '.timeline-tracks-scroll-container'
    ) as HTMLElement | null;
    if (!scrollEl) return;

    const onMove = () => {
      requestAnimationFrame(() => {
        setLineTop(computeTop());
      });
    };

    onMove();
    scrollEl.addEventListener('scroll', onMove, { passive: true });
    window.addEventListener('resize', onMove);

    const ro = new ResizeObserver(onMove);
    ro.observe(scrollEl);
    const wrapper = document.querySelector('.timeline-tracks-wrapper');
    if (wrapper) ro.observe(wrapper);

    return () => {
      scrollEl.removeEventListener('scroll', onMove);
      window.removeEventListener('resize', onMove);
      ro.disconnect();
    };
  }, [sourceIndex, computeTop]);

  if (sourceIndex === null || gapIndex === null || lineTop === null) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-[280] border-t-[3px] border-primary shadow-[0_-1px_12px_hsl(var(--primary)/0.55)]"
      style={{ top: lineTop }}
      aria-hidden
    />
  );
};
