'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shadcn/utils';

interface CallEndedViewProps {
  onRestart: () => void;
  className?: string;
}

export const CallEndedView = ({
  onRestart,
  ref,
  className,
  ...props
}: React.ComponentProps<'div'> & CallEndedViewProps) => {
  return (
    <div
      ref={ref}
      className={cn('bg-background flex flex-col items-center justify-center px-6 text-center', className)}
      {...props}
    >
      {/* Completed icon */}
      <div className="ff-animate-fade-in-up mb-4 flex size-20 items-center justify-center rounded-full bg-[var(--ff-green)]/10">
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Checkmark */}
          <circle cx="20" cy="20" r="18" stroke="var(--ff-green)" strokeWidth="2" opacity="0.4" />
          <path
            d="M12 20 L18 26 L28 14"
            stroke="var(--ff-green)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Small leaf accent */}
          <path
            d="M30 8 C28 10, 26 12, 28 14 C30 12, 32 10, 30 8Z"
            fill="var(--ff-green)"
            opacity="0.5"
          />
        </svg>
      </div>

      <h2 className="text-foreground text-xl font-bold">Call Ended</h2>

      <p className="text-muted-foreground mt-2 max-w-xs text-sm leading-relaxed">
        Thanks for talking with Farm &amp; Field.
      </p>

      <p className="text-muted-foreground mt-1 text-xs opacity-60">
        നന്ദി! ഫാം ആന്റ് ഫീൽഡ് ഉപയോഗിച്ചതിന് നന്ദി
      </p>

      {/* Restart button */}
      <Button
        id="start-again-btn"
        size="lg"
        onClick={onRestart}
        className="mt-8 w-64 rounded-full font-sans text-sm font-semibold tracking-wide"
      >
        🌾 Start Again
      </Button>

      <p className="text-muted-foreground mt-3 text-xs opacity-60">
        Your assistant is always here to help.
      </p>
    </div>
  );
};
