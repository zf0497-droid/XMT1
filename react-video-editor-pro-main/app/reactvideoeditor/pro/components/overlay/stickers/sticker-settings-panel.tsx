import React from "react";
import { StickerOverlay } from "../../../types";
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert";
import { t } from "../../../locales";

/**
 * Props for the StickerSettingsPanel component
 */
interface StickerSettingsPanelProps {
  localOverlay: StickerOverlay;
  handleStyleChange: (updates: Partial<StickerOverlay["styles"]>) => void;
}

/**
 * StickerSettingsPanel Component
 *
 * @component
 * @description
 * Provides settings controls for sticker overlays including
 * animation settings and 3D layout effects.
 */
export const StickerSettingsPanel: React.FC<StickerSettingsPanelProps> = ({
}) => {

  return (
    <div className="space-y-2">
  
  <Alert variant="default">
  <AlertTitle>{t.sticker.settingsComingTitle}</AlertTitle>
  <AlertDescription>
    {t.sticker.settingsComingDesc}
  </AlertDescription>
</Alert>

    </div>
  );
}; 