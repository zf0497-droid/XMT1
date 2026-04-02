import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { EditorProvider as EditorContextProvider, EditorContextProps } from "../../contexts/editor-context";
import { useOverlays } from "../../hooks/use-overlays";
import { useVideoPlayer } from "../../hooks/use-video-player";
// Removed useHistory import - Timeline now manages its own history
import { useCompositionDuration } from "../../hooks/use-composition-duration";
import { useAutosave } from "../../hooks/use-autosave";
import { useAspectRatio } from "../../hooks/use-aspect-ratio";
import { Overlay, CaptionStyles, AspectRatio } from "../../types";
import { syncProjectToRemote } from "../../utils/project-remote-sync";
import { COMP_NAME } from "../../../../constants";

import { useRendering } from "../../hooks/use-rendering";
import { useRenderer } from "../../contexts/renderer-context";
import { PlayerRef } from "@remotion/player";
import { TIMELINE_CONSTANTS } from "../advanced-timeline/constants";
import { transformOverlaysForAspectRatio, shouldTransformOverlays, getDimensionsForAspectRatio } from "../../utils/aspect-ratio-transform";

interface EditorProviderProps {
  children: React.ReactNode;
  projectId: string;
  defaultOverlays?: Overlay[];
  defaultAspectRatio?: AspectRatio;
  defaultBackgroundColor?: string;
  autoSaveInterval?: number;
  fps?: number;
  onSaving?: (saving: boolean) => void;
  onSaved?: (timestamp: number) => void;
  
  // Loading State
  isLoadingProject?: boolean; // Whether the project from URL is still loading
  
  // Player Configuration
  playerRef?: React.RefObject<PlayerRef>; // External playerRef for manual control
  
  // API Configuration
  baseUrl?: string;

  /** 本地保存成功后，是否同步到你们自己的保存接口（/api/projects/save） */
  enableRemoteSync?: boolean;
  /** 远程同步防抖（毫秒），默认 8000 */
  remoteSyncDebounceMs?: number;
  
  // Timeline Configuration
  initialRows?: number;
  maxRows?: number;
  
  // Zoom Configuration  
  zoomConstraints?: {
    min: number;
    max: number;
    step: number;
    default: number;
  };
  
  // Snapping Configuration
  snappingConfig?: {
    thresholdFrames: number;
    enableVerticalSnapping: boolean;
  };
  
  // Feature Flags
  disableMobileLayout?: boolean;
  disableVideoKeyframes?: boolean;
  enablePushOnDrag?: boolean;
  
  // Video Dimensions
  videoWidth?: number;
  videoHeight?: number;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({
  children,
  projectId,
  defaultOverlays = [],
  defaultAspectRatio,
  defaultBackgroundColor,
  autoSaveInterval = 10000,
  fps = 30,
  onSaving,
  onSaved,
  
  // Loading State
  isLoadingProject = false,
  
  // Player Configuration
  playerRef: externalPlayerRef,
  
  // API Configuration
  baseUrl,
  enableRemoteSync = false,
  remoteSyncDebounceMs = 8000,
  
  // Configuration props
  initialRows = 5,
  maxRows = 8,
  zoomConstraints = {
    min: 0.2,
    max: 10,
    step: 0.1,
    default: 1,
  },
  snappingConfig = {
    thresholdFrames: 1,
    enableVerticalSnapping: true,
  },
  disableMobileLayout = false,
  disableVideoKeyframes = false,
  enablePushOnDrag = false,
  videoWidth = 1280,
  videoHeight = 720,
}) => {
  // Get renderer configuration to extract render type
  const rendererConfig = useRenderer();
  const renderType = rendererConfig.renderer.renderType?.type || "ssr";

  // Initialize hooks
  const {
    overlays,
    setOverlays,
    selectedOverlayId,
    setSelectedOverlayId,
    // Multi-select support
    selectedOverlayIds,
    setSelectedOverlayIds,
    changeOverlay,
    addOverlay,
    deleteOverlay,
    duplicateOverlay,
    splitOverlay,
    handleOverlayChange,
    resetOverlays,
  } = useOverlays(defaultOverlays);

  // Update overlays when defaultOverlays change AND project is loading
  // This ensures project overlays are applied when they finish loading
  const previousDefaultOverlaysRef = useRef(defaultOverlays);
  useEffect(() => {
    // Only update if we're loading a project and defaultOverlays actually changed
    if (isLoadingProject === false && 
        defaultOverlays !== previousDefaultOverlaysRef.current &&
        defaultOverlays.length > 0) {
      
      // Check if there's a projectId in URL (meaning we loaded a project)
      const hasProjectId = typeof window !== 'undefined' && 
        new URLSearchParams(window.location.search).has('projectId');
      
      if (hasProjectId) {
        console.log('[EditorProvider] Project loaded, applying project overlays:', defaultOverlays.length);
        setOverlays(defaultOverlays);
      }
    }
    previousDefaultOverlaysRef.current = defaultOverlays;
  }, [defaultOverlays, isLoadingProject, setOverlays]);

  const { isPlaying, currentFrame, playerRef: internalPlayerRef, togglePlayPause, formatTime, play, pause, seekTo } = useVideoPlayer(fps, externalPlayerRef);
  
  // Use external playerRef if provided, otherwise use internal one
  const playerRef = externalPlayerRef || internalPlayerRef;
  
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showAlignmentGuides, setShowAlignmentGuides] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState(defaultBackgroundColor || "white");
  const [trackHeight, setTrackHeight] = useState(TIMELINE_CONSTANTS.TRACK_HEIGHT);
  const [timelineItemHeight, setTimelineItemHeight] = useState(TIMELINE_CONSTANTS.TRACK_ITEM_HEIGHT);
  const { durationInFrames, durationInSeconds } = useCompositionDuration(overlays, fps);
  
  
  const { aspectRatio, setAspectRatio: setAspectRatioBase, playerDimensions, updatePlayerDimensions, getAspectRatioDimensions } = useAspectRatio(defaultAspectRatio);
  
  // Track previous canvas dimensions for aspect ratio transformations
  const previousDimensionsRef = useRef(getAspectRatioDimensions());
  
  // Update aspect ratio when defaultAspectRatio changes AND project is loading
  // This ensures project aspect ratio is applied when it finishes loading
  const previousDefaultAspectRatioRef = useRef(defaultAspectRatio);
  useEffect(() => {
    // Only update if we're loading a project and defaultAspectRatio actually changed
    if (isLoadingProject === false && 
        defaultAspectRatio !== previousDefaultAspectRatioRef.current &&
        defaultAspectRatio) {
      
      // Check if there's a projectId in URL (meaning we loaded a project)
      const hasProjectId = typeof window !== 'undefined' && 
        new URLSearchParams(window.location.search).has('projectId');
      
      if (hasProjectId) {
        console.log('[EditorProvider] Project loaded, applying project aspect ratio:', defaultAspectRatio);
        // Use the base setter directly to avoid transformation (project overlays are already correct for this ratio)
        setAspectRatioBase(defaultAspectRatio);
        
        // Update the previous dimensions ref to match the loaded aspect ratio
        previousDimensionsRef.current = getDimensionsForAspectRatio(defaultAspectRatio);
      }
    }
    previousDefaultAspectRatioRef.current = defaultAspectRatio;
  }, [defaultAspectRatio, isLoadingProject, setAspectRatioBase]);
  
  // Wrapped setAspectRatio that transforms overlays when aspect ratio changes
  const setAspectRatio = useCallback((newRatio: typeof aspectRatio) => {
    const oldDimensions = previousDimensionsRef.current;
    const newDimensions = getDimensionsForAspectRatio(newRatio);
    
    // Update the aspect ratio first
    setAspectRatioBase(newRatio);
    
    // Transform all overlays if dimensions changed
    if (shouldTransformOverlays(oldDimensions, newDimensions)) {
      const transformedOverlays = transformOverlaysForAspectRatio(
        overlays,
        oldDimensions,
        newDimensions
      );
      setOverlays(transformedOverlays);
    }
    
    // Update the previous dimensions ref
    previousDimensionsRef.current = newDimensions;
  }, [setAspectRatioBase, overlays, setOverlays]);

  // Get dynamic dimensions based on current aspect ratio
  const { width: dynamicWidth, height: dynamicHeight } = getAspectRatioDimensions();

  /** 导出参数与当前画布一致；useMemo 避免无意义引用变化导致渲染回调抖动 */
  const renderCompositionInputProps = useMemo(
    () => ({
      overlays,
      durationInFrames,
      fps,
      width: dynamicWidth,
      height: dynamicHeight,
      aspectRatio,
      src: "" as string,
      backgroundColor,
    }),
    [
      overlays,
      durationInFrames,
      fps,
      dynamicWidth,
      dynamicHeight,
      aspectRatio,
      backgroundColor,
    ]
  );

  // Set up rendering functionality
  const { renderMedia: triggerRender, state: renderState } = useRendering(
    COMP_NAME, // Remotion bundle 里的 Composition id，需与 root.tsx 一致
    renderCompositionInputProps
  );

  // State for general editor state - separate from render state to prevent unnecessary re-renders
  const [state, setState] = useState<any>({
    overlays,
    selectedOverlayId,
    selectedOverlayIds,
    aspectRatio,
    playbackRate,
    durationInFrames,
    currentFrame,
    backgroundColor,
  });

  // Update state when dependencies change (excluding renderState to prevent unnecessary re-renders)
  useEffect(() => {
    setState({
      overlays,
      selectedOverlayId,
      selectedOverlayIds,
      aspectRatio,
      playbackRate,
      durationInFrames,
      currentFrame,
      backgroundColor,
    });
  }, [overlays, selectedOverlayId, selectedOverlayIds, aspectRatio, playbackRate, durationInFrames, currentFrame, backgroundColor]);

  const onRemoteSync = useCallback(
    async (editorState: Record<string, unknown>) => {
      await syncProjectToRemote({
        id: projectId,
        overlays: (editorState.overlays as []) ?? [],
        aspect_ratio: editorState.aspectRatio as string | undefined,
        background_color: editorState.backgroundColor as string | undefined,
      });
    },
    [projectId]
  );

  // Autosave functionality
  const { saveState, isInitialLoadComplete } = useAutosave(projectId, state, {
    interval: autoSaveInterval,
    isLoadingProject, // Pass project loading state to prevent overwriting project overlays
    enableRemoteSync,
    onRemoteSync,
    remoteSyncDebounceMs,
    onLoad: (loadedState) => {
      // Apply loaded state to editor automatically
      if (loadedState.overlays) {
        setOverlays(loadedState.overlays);
      }
      if (loadedState.aspectRatio) {
        // Use the base setter directly when loading from autosave to avoid transformation
        setAspectRatioBase(loadedState.aspectRatio);
        
        // Update the previous dimensions ref to match the loaded aspect ratio
        previousDimensionsRef.current = getDimensionsForAspectRatio(loadedState.aspectRatio);
      }
      if (loadedState.playbackRate) {
        setPlaybackRate(loadedState.playbackRate);
      }
      if (loadedState.backgroundColor) {
        setBackgroundColor(loadedState.backgroundColor);
      }
    },
    onSave: () => {
      if (onSaving) onSaving(false);
      if (onSaved) onSaved(Date.now());
    },
  });

  // Manual save function
  const saveProject = useCallback(async () => {
    if (onSaving) onSaving(true);
    try {
      await saveState();
      if (onSaved) onSaved(Date.now());
    } finally {
      if (onSaving) onSaving(false);
    }
  }, [saveState, onSaving, onSaved]);

  // Timeline click handler
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const timelineWidth = rect.width;
    const clickRatio = clickX / timelineWidth;
    const targetFrame = Math.round(clickRatio * durationInFrames);
    
    seekTo(targetFrame);
  }, [durationInFrames, seekTo]);

  // Delete overlays by row
  const deleteOverlaysByRow = useCallback((row: number) => {
    const overlaysToDelete = overlays.filter(overlay => overlay.row === row);
    overlaysToDelete.forEach(overlay => deleteOverlay(overlay.id));
  }, [overlays, deleteOverlay]);

  // Update overlay styles
  const updateOverlayStyles = useCallback((overlayId: number, styles: Partial<CaptionStyles>) => {
    changeOverlay(overlayId, (overlay) => ({
      ...overlay,
      styles: {
        ...overlay.styles,
        ...styles,
      },
    } as Overlay));
  }, [changeOverlay]);

  // Context value
  const contextValue: EditorContextProps = {
    // Overlay Management
    overlays,
    selectedOverlayId,
    setSelectedOverlayId,
    // Multi-select support
    selectedOverlayIds,
    setSelectedOverlayIds,
    changeOverlay,
    setOverlays,

    // Player State
    isPlaying,
    currentFrame,
    playerRef,
    playbackRate,
    setPlaybackRate,

    // Player Controls
    togglePlayPause,
    play,
    pause,
    seekTo,
    formatTime,
    handleTimelineClick,

    // Overlay Operations
    handleOverlayChange,
    addOverlay,
    deleteOverlay,
    duplicateOverlay,
    splitOverlay,

    // Video Dimensions and Aspect Ratio
    aspectRatio,
    setAspectRatio,
    playerDimensions,
    updatePlayerDimensions,
    getAspectRatioDimensions,

    // Video Properties
    durationInFrames,
    durationInSeconds,
    renderMedia: triggerRender, // Now connected to actual rendering
    state,
    renderState, // Provide render state separately

    // Timeline
    deleteOverlaysByRow,

    // Style management
    updateOverlayStyles,

    // Reset
    resetOverlays,

    // Autosave
    saveProject,

    // Render type (extracted from renderer)
    renderType,

    // FPS
    fps,

    // Configuration
    initialRows,
    maxRows,
    zoomConstraints,
    snappingConfig,
    disableMobileLayout,
    disableVideoKeyframes,
    enablePushOnDrag,
    videoWidth,
    videoHeight,

    // API Configuration - use conditional spreading for optional properties
    ...(baseUrl !== undefined && { baseUrl }),
    
    // Alignment Guides
    showAlignmentGuides,
    setShowAlignmentGuides,

    // Settings
    backgroundColor,
    setBackgroundColor,
    
    // Timeline Height Settings
    trackHeight,
    setTrackHeight,
    timelineItemHeight,
    setTimelineItemHeight,
    
    // Combined loading state: wait for both autosave check AND project loading
    isInitialLoadComplete: isInitialLoadComplete && !isLoadingProject,
  };

  return (
    <EditorContextProvider value={contextValue}>
      {children}
    </EditorContextProvider>
  );
}; 