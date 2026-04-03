import React, { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../ui/dropdown-menu';
import {
  Monitor,
  Square,
  Smartphone,
  Instagram,
  Settings2,
  Check,
  ChevronDown,
  Tv,
  RectangleVertical,
} from 'lucide-react';
import { Button } from '../../../ui/button';
import type { AspectRatio, KnownAspectRatio } from '../../../../types';
import { ASPECT_RATIO_PRESETS } from '../../../../utils/aspect-ratio-transform';
import { t } from '../../../../locales';

interface AspectRatioDropdownProps {
  /** Current aspect ratio */
  aspectRatio: AspectRatio;
  /** Callback when aspect ratio changes */
  onAspectRatioChange: (ratio: AspectRatio) => void;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/** 图标与颜色：仅针对 KnownAspectRatio；新增预设须在此补一项 */
const ASPECT_RATIO_UI: Record<
  KnownAspectRatio,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  '16:9': { icon: Monitor, color: 'text-blue-500' },
  '4:3': { icon: Tv, color: 'text-cyan-500' },
  '1:1': { icon: Square, color: 'text-green-500' },
  '4:5': { icon: Instagram, color: 'text-pink-500' },
  '9:16': { icon: Smartphone, color: 'text-purple-500' },
  '3:4': { icon: RectangleVertical, color: 'text-amber-500' },
};

const ASPECT_RATIO_OPTIONS = ASPECT_RATIO_PRESETS.map((p) => {
  const ui = ASPECT_RATIO_UI[p.id];
  return {
    value: p.id as AspectRatio,
    label: p.id,
    icon: ui.icon,
    color: ui.color,
  };
});

const desc = t.canvasAspectRatio.description as Record<string, string>;

export const AspectRatioDropdown: React.FC<AspectRatioDropdownProps> = ({
  aspectRatio,
  onAspectRatioChange,
  disabled = false,
  className = '',
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const currentOption = ASPECT_RATIO_OPTIONS.find(
    (option) => option.value === aspectRatio
  );

  return (
    <div className="hidden md:block">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className={`gap-2 min-w-[90px] justify-between border-border bg-background hover:bg-accent hover:text-accent-foreground shadow-none ${className}`}
            onTouchStart={(e) => e.preventDefault()}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="flex items-center gap-2">
              {currentOption && (
                <>
                  <currentOption.icon
                    className={`h-3.5 w-3.5 ${currentOption.color}`}
                  />
                  <span className="text-primary font-extralight text-xs">
                    {currentOption.label}
                  </span>
                </>
              )}
            </div>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-56 border-border bg-popover"
          align="start"
          onCloseAutoFocus={(e) => {
            // 关闭后不要把焦点还给触发按钮，否则按空格会再次打开菜单或误触第一项
            e.preventDefault();
          }}
        >
          <DropdownMenuLabel className="flex items-center gap-2 text-popover-foreground font-extralight">
            <Settings2 className="h-4 w-4" />
            {t.canvasAspectRatio.title}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuRadioGroup
            value={aspectRatio}
            onValueChange={(value) => {
              onAspectRatioChange(value as AspectRatio);
              setMenuOpen(false);
            }}
          >
            {ASPECT_RATIO_OPTIONS.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              >
                <option.icon className={`h-4 w-4 ${option.color}`} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extralight">
                      {option.label}
                    </span>
                    {aspectRatio === option.value && (
                      <Check className="h-3 w-3 text-primary" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-extralight">
                    {desc[option.value] ?? `比例 ${option.value}`}
                  </span>
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
