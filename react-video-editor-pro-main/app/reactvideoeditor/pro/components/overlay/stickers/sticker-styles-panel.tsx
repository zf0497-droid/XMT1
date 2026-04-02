import React from "react";
import { StickerOverlay } from "../../../types";
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert";

/**
 * Props for the StickerStylesPanel component
 */
interface StickerStylesPanelProps {
  localOverlay?: StickerOverlay;
  handleStyleChange?: (updates: Partial<StickerOverlay["styles"]>) => void;
}

/**
 * StickerStylesPanel Component
 *
 * @component
 * @description
 * Provides Styles controls for sticker overlays including
 * animation Styles and 3D layout effects.
 */
export const StickerStylesPanel: React.FC<StickerStylesPanelProps> = ({
}) => {

  return (
    <div className="space-y-2">
  
  <Alert variant="default">
  <AlertTitle>贴纸样式</AlertTitle>
  <AlertDescription>
    后续将可在此自定义贴纸样式。
  </AlertDescription>
</Alert>

    </div>
  );
}; 