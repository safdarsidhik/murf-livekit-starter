'use client';

import { cn } from '@/lib/shadcn/utils';

interface ConnectingViewProps {
  className?: string;
}

export const ConnectingView = ({
  ref,
  className,
  ...props
}: React.ComponentProps<'div'> & ConnectingViewProps) => {
  return (
    <div
      ref={ref}
      className={cn('bg-background flex flex-col items-center justify-center text-center', className)}
      {...props}
    >
      {/* Animated connecting visual */}
      <div className="relative mb-6 flex items-center justify-center">
        {/* Outer ring - slow spin */}
        <div className="ff-animate-spin-slow absolute size-24 rounded-full border-2 border-transparent border-t-[var(--ff-green)] opacity-40" />
        {/* Middle ring - reverse spin */}
        <div
          className="absolute size-16 rounded-full border-2 border-transparent border-b-[var(--ff-green)] opacity-30"
          style={{ animation: 'ff-spin-slow 2s linear infinite reverse' }}
        />
        {/* Center seedling */}
        <span className="ff-animate-breathing text-3xl" role="img" aria-label="seedling">
          🌱
        </span>
      </div>

      <h2 className="text-foreground text-xl font-bold">Connecting…</h2>
      <p className="text-muted-foreground mt-2 max-w-xs text-sm leading-relaxed">
        Please wait while we connect you to Farm &amp; Field.
      </p>

      {/* Pulsing dots */}
      <div className="mt-4 flex gap-1.5" aria-hidden="true">
        <span
          className="ff-animate-dot-pulse size-2 rounded-full bg-[var(--ff-green)]"
          style={{ animationDelay: '0s' }}
        />
        <span
          className="ff-animate-dot-pulse size-2 rounded-full bg-[var(--ff-green)]"
          style={{ animationDelay: '0.3s' }}
        />
        <span
          className="ff-animate-dot-pulse size-2 rounded-full bg-[var(--ff-green)]"
          style={{ animationDelay: '0.6s' }}
        />
      </div>
    </div>
  );
};
