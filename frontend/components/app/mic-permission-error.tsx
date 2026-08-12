'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shadcn/utils';

interface MicPermissionErrorProps {
  onRetry: () => void;
  errorType?: 'denied' | 'not_found' | 'in_use' | 'generic';
  className?: string;
}

const ERROR_MESSAGES: Record<
  string,
  { title: string; description: string; instruction: string }
> = {
  denied: {
    title: 'Microphone access is blocked',
    description:
      'This voice agent needs access to your microphone to hear you.',
    instruction:
      'Please enable microphone permission in your browser\'s site settings and try again.',
  },
  not_found: {
    title: 'No microphone detected',
    description:
      'We could not find a microphone connected to your device.',
    instruction:
      'Please connect a microphone or headset and try again.',
  },
  in_use: {
    title: 'Microphone is in use',
    description:
      'Your microphone appears to be used by another application.',
    instruction:
      'Please close other apps that may be using your microphone, then try again.',
  },
  generic: {
    title: 'Microphone error',
    description:
      'Something went wrong while trying to access your microphone.',
    instruction:
      'Please check your microphone settings and try again.',
  },
};

export function MicPermissionError({
  onRetry,
  errorType = 'denied',
  className,
}: MicPermissionErrorProps) {
  const errorInfo = ERROR_MESSAGES[errorType] || ERROR_MESSAGES.generic;

  return (
    <div
      className={cn(
        'bg-background flex flex-col items-center justify-center px-6 text-center',
        className
      )}
      role="alert"
    >
      {/* Blocked microphone icon */}
      <div className="ff-animate-fade-in-up mb-5 flex size-20 items-center justify-center rounded-full bg-[var(--ff-error)]/10">
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Mic body */}
          <rect x="15" y="6" width="10" height="18" rx="5" stroke="var(--ff-error)" strokeWidth="2" fill="none" />
          {/* Mic stand */}
          <path d="M10 22 C10 28, 14 32, 20 32 C26 32, 30 28, 30 22" stroke="var(--ff-error)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <line x1="20" y1="32" x2="20" y2="36" stroke="var(--ff-error)" strokeWidth="2" strokeLinecap="round" />
          <line x1="15" y1="36" x2="25" y2="36" stroke="var(--ff-error)" strokeWidth="2" strokeLinecap="round" />
          {/* Slash / block line */}
          <line x1="8" y1="8" x2="32" y2="32" stroke="var(--ff-error)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      <h2 className="text-foreground text-xl font-bold">{errorInfo.title}</h2>

      <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
        {errorInfo.description}
      </p>

      {/* Browser-specific instructions */}
      <div className="bg-secondary mt-4 max-w-sm rounded-xl px-5 py-4 text-left">
        <p className="text-secondary-foreground text-sm font-medium">How to fix this:</p>
        <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
          {errorInfo.instruction}
        </p>
        <ol className="text-muted-foreground mt-3 list-inside list-decimal space-y-1.5 text-xs leading-relaxed">
          <li>Click the lock/site icon in your browser&apos;s address bar</li>
          <li>Find &ldquo;Microphone&rdquo; in the permissions list</li>
          <li>Change it to &ldquo;Allow&rdquo;</li>
          <li>Reload this page or click &ldquo;Try Again&rdquo; below</li>
        </ol>
      </div>

      {/* Try Again button */}
      <Button
        id="mic-retry-btn"
        size="lg"
        onClick={onRetry}
        className="mt-6 w-64 rounded-full font-sans text-sm font-semibold tracking-wide"
      >
        Try Again
      </Button>
    </div>
  );
}
