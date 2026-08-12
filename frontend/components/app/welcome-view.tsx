'use client';

import { Button } from '@/components/ui/button';

function SeedlingIcon() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mb-2"
      aria-hidden="true"
    >
      {/* Pot */}
      <path
        d="M25 58 L55 58 L52 72 L28 72 Z"
        fill="var(--ff-green)"
        opacity="0.25"
        rx="2"
      />
      <rect x="22" y="54" width="36" height="6" rx="2" fill="var(--ff-green)" opacity="0.35" />

      {/* Stem */}
      <path
        d="M40 54 L40 30"
        stroke="var(--ff-green)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Left leaf */}
      <path
        d="M40 42 C32 42, 22 36, 22 26 C30 26, 38 32, 40 42Z"
        fill="var(--ff-green)"
        opacity="0.8"
      />

      {/* Right leaf */}
      <path
        d="M40 34 C48 32, 56 22, 54 14 C46 16, 40 26, 40 34Z"
        fill="var(--ff-green)"
        opacity="0.6"
      />

      {/* Small bud */}
      <circle cx="40" cy="26" r="4" fill="var(--ff-green)" opacity="0.9" />
    </svg>
  );
}

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  return (
    <div ref={ref}>
      <section className="bg-background flex flex-col items-center justify-center px-6 text-center">
        {/* Agent visual */}
        <div className="ff-animate-breathing">
          <SeedlingIcon />
        </div>

        {/* Title */}
        <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
          Farm &amp; Field
        </h1>

        <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed md:text-base">
          Your AI-powered digital farming assistant
        </p>

        <p className="text-muted-foreground mt-1 text-xs opacity-75 md:text-sm">
          നിങ്ങളുടെ ഡിജിറ്റൽ കർഷക മിത്രം
        </p>

        {/* Feature chips */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {['🌾 Crop Advisory', '🌤️ Weather', '💰 Market Prices', '🧪 Soil Health'].map(
            (chip) => (
              <span
                key={chip}
                className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-medium"
              >
                {chip}
              </span>
            )
          )}
        </div>

        {/* Start button */}
        <Button
          id="start-conversation-btn"
          size="lg"
          onClick={onStartCall}
          className="ff-animate-pulse-glow mt-8 w-64 rounded-full font-sans text-sm font-semibold tracking-wide"
        >
          {startButtonText}
        </Button>

        <p className="text-muted-foreground mt-3 text-xs opacity-60">
          Ready to talk? Click to begin.
        </p>
      </section>

      <div className="fixed bottom-5 left-0 flex w-full items-center justify-center">
        <p className="text-muted-foreground max-w-prose pt-1 text-xs leading-5 font-normal text-pretty">
          Powered by Farm &amp; Field AI
        </p>
      </div>
    </div>
  );
};
