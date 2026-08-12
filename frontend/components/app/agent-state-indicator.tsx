'use client';

import { cn } from '@/lib/shadcn/utils';

export type AgentUIState =
  | 'ready'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'thinking'
  | 'call_ended';

interface AgentStateIndicatorProps {
  state: AgentUIState;
  className?: string;
}

const STATE_CONFIG: Record<
  AgentUIState,
  { label: string; subLabel: string; dotClass: string; iconElement: React.ReactNode }
> = {
  ready: {
    label: 'Ready',
    subLabel: 'Click Start to begin',
    dotClass: 'bg-[var(--ff-green)] opacity-60',
    iconElement: null,
  },
  connecting: {
    label: 'Connecting…',
    subLabel: 'Please wait',
    dotClass: 'bg-[var(--ff-gold)] ff-animate-dot-pulse',
    iconElement: (
      <svg className="ff-animate-spin-slow size-4 opacity-70" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
        <path d="M12 2 A10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  listening: {
    label: 'Listening to you',
    subLabel: 'Speak naturally',
    dotClass: 'bg-[var(--ff-listening)] ff-animate-dot-pulse',
    iconElement: (
      <div className="flex items-end gap-[3px]" aria-hidden="true">
        <span className="ff-wave-bar" />
        <span className="ff-wave-bar" />
        <span className="ff-wave-bar" />
        <span className="ff-wave-bar" />
        <span className="ff-wave-bar" />
      </div>
    ),
  },
  speaking: {
    label: 'Agent is speaking',
    subLabel: 'Please wait for the response',
    dotClass: 'bg-[var(--ff-speaking)] ff-animate-dot-pulse',
    iconElement: (
      <div className="flex items-end gap-[2px]" aria-hidden="true">
        <span className="ff-speak-bar" />
        <span className="ff-speak-bar" />
        <span className="ff-speak-bar" />
        <span className="ff-speak-bar" />
        <span className="ff-speak-bar" />
        <span className="ff-speak-bar" />
        <span className="ff-speak-bar" />
      </div>
    ),
  },
  thinking: {
    label: 'Thinking…',
    subLabel: 'Preparing a response',
    dotClass: 'bg-[var(--ff-thinking)] ff-animate-dot-pulse',
    iconElement: (
      <div className="flex gap-1" aria-hidden="true">
        <span className="bg-[var(--ff-thinking)] ff-animate-dot-pulse size-1.5 rounded-full" style={{ animationDelay: '0s' }} />
        <span className="bg-[var(--ff-thinking)] ff-animate-dot-pulse size-1.5 rounded-full" style={{ animationDelay: '0.3s' }} />
        <span className="bg-[var(--ff-thinking)] ff-animate-dot-pulse size-1.5 rounded-full" style={{ animationDelay: '0.6s' }} />
      </div>
    ),
  },
  call_ended: {
    label: 'Call ended',
    subLabel: 'Thanks for talking with me',
    dotClass: 'bg-[var(--muted-foreground)] opacity-50',
    iconElement: null,
  },
};

export function AgentStateIndicator({ state, className }: AgentStateIndicatorProps) {
  const config = STATE_CONFIG[state];

  return (
    <div
      className={cn(
        'ff-animate-fade-in-up flex items-center gap-3 rounded-full px-4 py-2',
        'bg-card/80 border-border/50 border backdrop-blur-sm',
        'transition-all duration-300 ease-out',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`Agent state: ${config.label}`}
    >
      {/* Status dot */}
      <span
        className={cn('size-2.5 shrink-0 rounded-full transition-colors duration-300', config.dotClass)}
      />

      {/* Text */}
      <div className="flex flex-col">
        <span className="text-foreground text-sm font-semibold leading-tight">{config.label}</span>
        <span className="text-muted-foreground text-xs leading-tight">{config.subLabel}</span>
      </div>

      {/* Animated icon element */}
      {config.iconElement && <div className="ml-1 flex shrink-0 items-center">{config.iconElement}</div>}
    </div>
  );
}
