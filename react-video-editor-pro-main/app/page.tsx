"use client";

import React from 'react';

import { HttpRenderer } from './reactvideoeditor/pro/utils/http-renderer';
import { ReactVideoEditor } from './reactvideoeditor/pro/components/react-video-editor';
import { createPexelsVideoAdaptor } from './reactvideoeditor/pro/adaptors/pexels-video-adaptor';
import { createPexelsImageAdaptor } from './reactvideoeditor/pro/adaptors/pexels-image-adaptor';
import { SHOW_MOBILE_WARNING } from './constants';
import { CustomTheme } from './reactvideoeditor/pro/hooks/use-extended-theme-switcher';
import { MobileWarningModal } from './reactvideoeditor/pro/components/shared/mobile-warning-modal';
import { ProjectLoadConfirmModal } from './reactvideoeditor/pro/components/shared/project-load-confirm-modal';
import { useProjectStateFromUrl } from './reactvideoeditor/pro/hooks/use-project-state-from-url';

export default function SimplePage() {
  /**
   * 默认工程键（无 ?projectId= 时使用）。Remotion 成片用的 Composition id 在 constants 的 COMP_NAME，
   * 与本地/远程「项目 id」分离，避免 URL 项目 UUID 破坏导出。
   */
  const DEFAULT_STORAGE_PROJECT_ID = "TestComponent";

  /**
   * Load project state from API via URL parameter.
   * 有 ?projectId= 时，IndexedDB 与远程保存均使用该 id 作为工程键。
   * NEXT_PUBLIC_LOCAL_SAVE_FIRST=true 时优先恢复本地草稿。
   */
  const {
    overlays,
    aspectRatio,
    backgroundColor,
    isLoading,
    showModal,
    onConfirmLoad,
    onCancelLoad,
    storageProjectId,
  } = useProjectStateFromUrl("projectId", DEFAULT_STORAGE_PROJECT_ID);

  // Handle theme changes
  const handleThemeChange = (themeId: string) => {
    console.log('Theme changed to:', themeId);
    // You can add additional theme change logic here
  };

    // Define available themes - you can add more custom themes here
    const availableThemes: CustomTheme[] = [
      {
        id: 'rve',
        name: '默认',
        className: 'rve',
        color: '#3E8AF5'
      },
    ];
  

   // Default renderer uses NextJS API routes
   const ssrRenderer = React.useMemo(() => 
    new HttpRenderer('/api/latest/ssr', {
      type: 'ssr',
      entryPoint: '/api/latest/ssr'
    }), []
  );

  // const lambdaRenderer = React.useMemo(() => 
  //   new HttpRenderer('/api/latest/lambda', {
  //     type: 'lambda',
  //     entryPoint: '/api/latest/lambda'
  //   }), []
  // );

  return (
    <div className="w-full h-full fixed inset-0">
      <MobileWarningModal show={SHOW_MOBILE_WARNING} />
      <ProjectLoadConfirmModal 
        isVisible={showModal}
        onConfirm={onConfirmLoad}
        onCancel={onCancelLoad}
      />
      <ReactVideoEditor
        projectId={storageProjectId}
        defaultOverlays={overlays as any}
        defaultAspectRatio={aspectRatio || undefined}
        defaultBackgroundColor={backgroundColor || undefined}
        isLoadingProject={isLoading}
        fps={30}
        renderer={ssrRenderer}
        enableRemoteSync={
          process.env.NEXT_PUBLIC_ENABLE_REMOTE_PROJECT_SYNC === "true"
        }
        remoteSyncDebounceMs={8000}
        disabledPanels={[]}
        availableThemes={availableThemes}
        defaultTheme="dark"
        adaptors={{
          video: [createPexelsVideoAdaptor('CEOcPegZJRoNztih7auwNoFZmIFTmlYoZTI0NgTRCUxkFhXORBhERORM')],
          images: [createPexelsImageAdaptor('CEOcPegZJRoNztih7auwNoFZmIFTmlYoZTI0NgTRCUxkFhXORBhERORM')],
        }}
        onThemeChange={handleThemeChange}
        showDefaultThemes={true}
        sidebarWidth="clamp(350px, 25vw, 500px)"        
        sidebarIconWidth="57.6px"
        showIconTitles={false}
      />
    </div>
  );
} 