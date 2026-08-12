'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'motion/react';
import { useAgent, useSessionContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
import { CallEndedView } from '@/components/app/call-ended-view';
import { ConnectingView } from '@/components/app/connecting-view';
import { MicPermissionError } from '@/components/app/mic-permission-error';
import { WelcomeView } from '@/components/app/welcome-view';
import type { AgentUIState } from '@/components/app/agent-state-indicator';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionSessionView = motion.create(AgentSessionView_01);
const MotionConnectingView = motion.create(ConnectingView);
const MotionCallEndedView = motion.create(CallEndedView);
const MotionMicError = motion.create(MicPermissionError);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
    },
    hidden: {
      opacity: 0,
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.4,
    ease: 'easeOut',
  },
};

/**
 * Maps the LiveKit agent state + connection status into our 5 UI states.
 *
 * LiveKit agent states: 'connecting', 'initializing', 'listening', 'thinking', 'speaking', 'idle', 'disconnected', 'failed'
 * Our UI states: 'ready', 'connecting', 'listening', 'speaking', 'thinking', 'call_ended'
 */
function mapAgentState(
  isConnected: boolean,
  agentState: string,
  hasDisconnected: boolean,
  hasMicError: boolean
): AgentUIState | 'mic_error' {
  if (hasMicError) return 'mic_error';
  if (hasDisconnected) return 'call_ended';
  if (!isConnected) return 'ready';

  // Connected — map LiveKit state
  switch (agentState) {
    case 'connecting':
    case 'initializing':
      return 'connecting';
    case 'speaking':
      return 'speaking';
    case 'thinking':
      return 'thinking';
    case 'listening':
    case 'idle':
    default:
      return 'listening';
  }
}

interface ViewControllerProps {
  appConfig: AppConfig;
}

export function ViewController({ appConfig }: ViewControllerProps) {
  const { isConnected, start, end } = useSessionContext();
  const { resolvedTheme } = useTheme();
  const { state: agentState } = useAgent();

  const [hasDisconnected, setHasDisconnected] = useState(false);
  const [wasConnected, setWasConnected] = useState(false);
  const [hasMicError, setHasMicError] = useState(false);
  const [micErrorType, setMicErrorType] = useState<'denied' | 'not_found' | 'in_use' | 'generic'>(
    'denied'
  );

  // Track connection → disconnection to show "Call Ended"
  useEffect(() => {
    if (isConnected) {
      setWasConnected(true);
      setHasDisconnected(false);
      setHasMicError(false);
    } else if (wasConnected && !isConnected) {
      setHasDisconnected(true);
    }
  }, [isConnected, wasConnected]);

  const uiState = mapAgentState(isConnected, agentState, hasDisconnected, hasMicError);

  // Start call with mic permission check
  const handleStartCall = useCallback(async () => {
    setHasMicError(false);
    setHasDisconnected(false);

    try {
      // Test microphone access before connecting
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the test stream immediately
      stream.getTracks().forEach((track) => track.stop());
      // Mic access OK — proceed with connection
      start();
    } catch (err: unknown) {
      const error = err as DOMException;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setMicErrorType('denied');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setMicErrorType('not_found');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setMicErrorType('in_use');
      } else {
        setMicErrorType('generic');
      }
      setHasMicError(true);
    }
  }, [start]);

  // Restart resets everything
  const handleRestart = useCallback(() => {
    setHasDisconnected(false);
    setWasConnected(false);
    setHasMicError(false);
  }, []);

  // Retry after mic error
  const handleMicRetry = useCallback(() => {
    setHasMicError(false);
    // Attempt to start again after a brief delay so the UI transitions smoothly
    setTimeout(() => {
      handleStartCall();
    }, 300);
  }, [handleStartCall]);

  return (
    <AnimatePresence mode="wait">
      {/* State 1: Ready */}
      {uiState === 'ready' && (
        <MotionWelcomeView
          key="welcome"
          {...VIEW_MOTION_PROPS}
          startButtonText={appConfig.startButtonText}
          onStartCall={handleStartCall}
        />
      )}

      {/* State 2: Connecting */}
      {uiState === 'connecting' && (
        <MotionConnectingView key="connecting" {...VIEW_MOTION_PROPS} />
      )}

      {/* State 3 & 4: Listening / Speaking / Thinking — all use session view */}
      {(uiState === 'listening' || uiState === 'speaking' || uiState === 'thinking') && (
        <MotionSessionView
          key="session-view"
          {...VIEW_MOTION_PROPS}
          supportsChatInput={appConfig.supportsChatInput}
          supportsVideoInput={appConfig.supportsVideoInput}
          supportsScreenShare={appConfig.supportsScreenShare}
          isPreConnectBufferEnabled={appConfig.isPreConnectBufferEnabled}
          audioVisualizerType={appConfig.audioVisualizerType}
          audioVisualizerColor={
            resolvedTheme === 'dark'
              ? appConfig.audioVisualizerColorDark
              : appConfig.audioVisualizerColor
          }
          audioVisualizerColorShift={appConfig.audioVisualizerColorShift}
          audioVisualizerBarCount={appConfig.audioVisualizerBarCount}
          audioVisualizerGridRowCount={appConfig.audioVisualizerGridRowCount}
          audioVisualizerGridColumnCount={appConfig.audioVisualizerGridColumnCount}
          audioVisualizerRadialBarCount={appConfig.audioVisualizerRadialBarCount}
          audioVisualizerRadialRadius={appConfig.audioVisualizerRadialRadius}
          audioVisualizerWaveLineWidth={appConfig.audioVisualizerWaveLineWidth}
          className="fixed inset-0"
        />
      )}

      {/* State 5: Call Ended */}
      {uiState === 'call_ended' && (
        <MotionCallEndedView
          key="call-ended"
          {...VIEW_MOTION_PROPS}
          onRestart={handleRestart}
        />
      )}

      {/* Error: Microphone permission */}
      {uiState === 'mic_error' && (
        <MotionMicError
          key="mic-error"
          {...VIEW_MOTION_PROPS}
          onRetry={handleMicRetry}
          errorType={micErrorType}
        />
      )}
    </AnimatePresence>
  );
}
