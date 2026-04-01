"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { t } from '../../locales';

interface MobileWarningModalProps {
  show: boolean;
}

export const MobileWarningModal: React.FC<MobileWarningModalProps> = ({ show }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if screen size is mobile (responsive check only)
    const checkIfMobileScreen = () => {
      return window.innerWidth <= 768;
    };

    // Check if user has already dismissed the modal
    const hasSeenWarning = localStorage.getItem('rve-mobile-warning-dismissed');
    
    if (show && checkIfMobileScreen() && !hasSeenWarning) {
      setIsMobile(true);
      setIsVisible(true);
    }
  }, [show]);

  const handleDismiss = () => {
    localStorage.setItem('rve-mobile-warning-dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible || !isMobile) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    >
      <div 
        className="bg-background border shadow-lg rounded-lg max-w-md w-full p-6 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-warning-title"
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-muted-foreground" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2
          id="mobile-warning-title"
          className="text-lg font-normal text-foreground text-center mb-2"
        >
          {t.mobile.hello}
        </h2>

        {/* Message */}
        <div className="text-sm font-extralight text-muted-foreground text-center space-y-2 mb-6">
          <p>
            {t.mobile.desktopExperience}
          </p>
          <p>
            {t.mobile.mobileUsage}
          </p>
        </div>

        {/* Button */}
        <Button
          onClick={handleDismiss}
          variant="default"
          className="w-full"
        >
          {t.mobile.continue}
        </Button>

        {/* Small note */}
        <p className="text-xs font-extralight text-muted-foreground text-center mt-4">
          {t.mobile.noShowAgain}
        </p>
      </div>
    </div>
  );
};
