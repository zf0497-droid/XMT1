import { TIMELINE_CONSTANTS } from '../constants';

/** 首尾行「靠边」判定比例：与最后一行 LAST 对称，第一行靠上为大块「最前」命中区 */
const EDGE = 0.3;

/**
 * 根据指针在时间轴内容区内的纵向像素位置（含滚动偏移）计算插入间隙 0…trackCount。
 * - 第一行：约上 70% → gap=0（整表最前），下 30% → gap=1
 * - 中间行：半行分界
 * - 最后一行：约上 30% → gap=n-1，下 70% 及行下空白 → gap=n
 */
export function contentYToInsertionGap(yInContent: number, trackCount: number): number {
  if (trackCount <= 0) return 0;
  const h = TIMELINE_CONSTANTS.TRACK_HEIGHT;
  const y = yInContent;

  if (trackCount === 1) {
    const frac = Math.min(1, Math.max(0, y / h));
    if (frac < EDGE) return 0;
    if (frac >= 1 - EDGE) return 1;
    return frac < 0.5 ? 0 : 1;
  }

  if (y >= 0 && y < h) {
    const fracInRow = y / h;
    return fracInRow < 1 - EDGE ? 0 : 1;
  }

  const yLast = (trackCount - 1) * h;
  if (y >= yLast + h * EDGE) {
    return trackCount;
  }

  const rowFloat = y / h;
  const rowIndex = Math.floor(Math.max(0, Math.min(trackCount - 1, rowFloat)));

  if (rowIndex === trackCount - 1) {
    const fracInRow = (y - yLast) / h;
    return fracInRow < EDGE ? trackCount - 1 : trackCount;
  }

  const frac = rowFloat - rowIndex;
  const gap = frac < 0.5 ? rowIndex : rowIndex + 1;
  return Math.max(0, Math.min(trackCount, gap));
}

/**
 * 轨道重排：根据「插入间隙」0…trackCount 换算 splice 的 toIndex。
 * 与 handleTrackReorder 中先 splice(from) 再 splice(to,0) 的语义一致。
 */
export function insertionGapToSpliceIndex(
  fromIndex: number,
  gap: number,
  trackCount: number
): number {
  let to = gap;
  if (fromIndex < gap) {
    to -= 1;
  }
  return Math.max(0, Math.min(trackCount - 1, to));
}

/** 手柄/单行 dragOver：首尾行用大命中区，中间行半行分界 */
export function rowDragOverToInsertionGap(
  clientY: number,
  rowRect: DOMRect,
  rowIndex: number,
  trackCount: number
): number {
  const rowH = rowRect.height;
  if (rowH <= 0) return Math.min(rowIndex + 1, trackCount);

  const relY = clientY - rowRect.top;
  const frac = relY / rowH;

  if (trackCount <= 1) {
    if (frac < EDGE) return 0;
    if (frac >= 1 - EDGE) return trackCount;
    return frac < 0.5 ? 0 : 1;
  }

  if (rowIndex === 0) {
    const threshold = rowRect.top + rowH * (1 - EDGE);
    return clientY < threshold ? 0 : 1;
  }

  if (rowIndex === trackCount - 1) {
    const threshold = rowRect.top + rowH * EDGE;
    return clientY < threshold ? rowIndex : trackCount;
  }

  const mid = rowRect.top + rowH / 2;
  const gap = clientY < mid ? rowIndex : rowIndex + 1;
  return Math.max(0, Math.min(trackCount, gap));
}
