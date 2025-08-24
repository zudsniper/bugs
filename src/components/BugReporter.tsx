import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Bug } from 'lucide-react';

import { BugReportData, BugReporterConfig, SubmissionResponse } from '../types';
import { bugReportCapture } from '../core/capture';
import { integrations } from '../integrations';
import { keyboardManager, themeManager, validationManager } from '../utils';
import { FloatingTrigger } from './FloatingTrigger';
import { ReportPopup } from './ReportPopup';
import { ThanksMessage } from './ThanksMessage';

export interface BugReporterProps {
  config: BugReporterConfig;
  onSubmitSuccess?: (response: SubmissionResponse) => void;
  onSubmitError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
  children?: React.ReactNode; // Custom trigger component
}

export function BugReporter({
  config,
  onSubmitSuccess,
  onSubmitError,
  onOpen,
  onClose,
  children
}: BugReporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Initialize capture options when config changes
  useEffect(() => {
    if (config.capture) {
      bugReportCapture.updateOptions({
        maxConsoleLogs: config.capture.maxConsoleLogs || 50,
        maxNetworkRequests: config.capture.maxNetworkRequests || 25,
        sensitiveParams: config.capture.sensitiveParams || [
          'token', 'key', 'secret', 'password', 'auth', 'authorization', 'api-key', 'apikey'
        ],
        excludeUrls: config.capture.excludeUrls || [],
        includeRequestHeaders: config.capture.includeRequestHeaders || false,
        includeResponseHeaders: config.capture.includeResponseHeaders || false
      });
    }
  }, [config.capture]);

  // Initialize theme
  useEffect(() => {
    if (config.ui?.theme) {
      if (config.ui.theme === 'auto') {
        themeManager.setTheme('auto');
      } else {
        const customTheme = themeManager.createCustomTheme(config.ui.theme, {
          colors: {
            primary: config.ui.primaryColor || undefined
          }
        });
        themeManager.setTheme(customTheme);
      }
    }

    themeManager.injectCSS();
  }, [config.ui?.theme, config.ui?.primaryColor]);

  // Initialize keyboard shortcuts
  useEffect(() => {
    if (config.keyboard?.openShortcut) {
      keyboardManager.addShortcut(config.keyboard.openShortcut, handleOpen);
    }
    
    if (config.keyboard?.closeShortcut) {
      keyboardManager.addShortcut(config.keyboard.closeShortcut, handleClose);
    }

    keyboardManager.start();

    return () => {
      keyboardManager.stop();
      keyboardManager.clearShortcuts();
    };
  }, [config.keyboard]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      bugReportCapture.stopCapturing();
    };
  }, []);

  const handleOpen = useCallback(() => {
    if (!mountedRef.current) return;
    
    setIsOpen(true);
    setError(null);
    bugReportCapture.startCapturing();
    onOpen?.();
  }, [onOpen]);

  const handleClose = useCallback(() => {
    if (!mountedRef.current) return;
    
    setIsOpen(false);
    setError(null);
    bugReportCapture.stopCapturing();
    onClose?.();
  }, [onClose]);

  const handleSubmit = useCallback(async (reportData: Partial<BugReportData>) => {
    if (!mountedRef.current || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Validate the report
      const validation = validationManager.validateBugReport(reportData, config);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Capture full report data
      const fullReportData = await bugReportCapture.captureReport(reportData);

      // Transform data if configured
      const finalData = config.advanced?.transformData 
        ? config.advanced.transformData(fullReportData)
        : fullReportData;

      // Call custom onBugReport handler
      config.advanced?.onBugReport?.(finalData);

      // Submit to configured integrations
      const integrationPromises: Promise<SubmissionResponse>[] = [];
      
      if (config.integrations) {
        Object.entries(config.integrations).forEach(([name, integrationConfig]) => {
          if (integrationConfig) {
            const integration = integrations[name as keyof typeof integrations];
            if (integration) {
              integrationPromises.push(
                integration.submit(finalData, integrationConfig)
              );
            }
          }
        });
      }

      if (integrationPromises.length === 0) {
        throw new Error('No integrations configured');
      }

      // Wait for all integrations to complete
      const results = await Promise.allSettled(integrationPromises);
      
      // Check if at least one integration succeeded
      const successfulResults = results.filter(
        (result): result is PromiseFulfilledResult<SubmissionResponse> => 
          result.status === 'fulfilled' && result.value.success
      );

      if (successfulResults.length === 0) {
        // All integrations failed
        const errors = results.map(result => 
          result.status === 'rejected' 
            ? result.reason?.message || 'Unknown error'
            : result.value.error || 'Submission failed'
        );
        throw new Error(`All integrations failed: ${errors.join(', ')}`);
      }

      // Use the first successful result
      const successResult = successfulResults[0].value;
      
      // Call success handlers
      onSubmitSuccess?.(successResult);
      config.advanced?.onSubmitSuccess?.(successResult);

      // Show success message
      setShowThanks(true);
      setTimeout(() => {
        if (mountedRef.current) {
          setShowThanks(false);
        }
      }, 3000);

      // Close the popup
      handleClose();

    } catch (error) {
      if (!mountedRef.current) return;
      
      const errorMessage = error instanceof Error ? error.message : 'Submission failed';
      setError(errorMessage);
      
      // Call error handlers
      const errorObj = error instanceof Error ? error : new Error(errorMessage);
      onSubmitError?.(errorObj);
      config.advanced?.onSubmitError?.(errorObj);

      // Log error if custom logger is provided
      config.advanced?.customLogger?.('error', 'Bug report submission failed', { error: errorMessage });
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [config, isSubmitting, onSubmitSuccess, onSubmitError, handleClose]);

  // Auto-submit functionality
  useEffect(() => {
    if (config.advanced?.autoSubmit && isOpen) {
      const timer = setTimeout(() => {
        handleSubmit({
          title: 'Auto-generated bug report',
          description: 'This report was automatically generated based on detected issues.'
        });
      }, config.advanced.debounceMs || 5000);

      return () => clearTimeout(timer);
    }
  }, [config.advanced?.autoSubmit, config.advanced?.debounceMs, isOpen, handleSubmit]);

  const position = config.ui?.position || 'bottom-right';
  const shouldShowTrigger = !children && !isOpen;

  return (
    <div className="br-bug-reporter" data-theme={themeManager.getCurrentThemeName()}>
      {/* Custom trigger component */}
      {children && React.cloneElement(children as React.ReactElement, { onClick: handleOpen })}
      
      {/* Default floating trigger */}
      <AnimatePresence>
        {shouldShowTrigger && (
          <FloatingTrigger
            position={position}
            onClick={handleOpen}
            primaryColor={config.ui?.primaryColor}
            icon={config.ui?.triggerComponent ? undefined : <Bug size={20} />}
          />
        )}
      </AnimatePresence>

      {/* Report popup */}
      <AnimatePresence>
        {isOpen && (
          <ReportPopup
            config={config}
            position={position}
            isSubmitting={isSubmitting}
            error={error}
            onClose={handleClose}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>

      {/* Thanks message */}
      <AnimatePresence>
        {showThanks && (
          <ThanksMessage
            message={config.ui?.thankYouMessage}
            position={position}
          />
        )}
      </AnimatePresence>
    </div>
  );
}