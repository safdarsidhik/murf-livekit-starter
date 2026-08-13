'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface HomeViewProps {
  onStartAgent: () => void;
}

export function HomeView({ onStartAgent }: HomeViewProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/40 via-background to-background p-8 text-center sm:p-12 shadow-xl backdrop-blur-sm">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 backdrop-blur-md mb-6">
            <span>🌱</span>
            <span>Multilingual Agricultural AI Advisory</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Farm &amp; Field AI Voice Assistant
          </h1>

          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Empowering farmers with real-time commodity prices, weather forecasts, personalized crop guidance, and human expert escalation in Malayalam and English.
          </p>

          <p className="mt-2 font-sans text-sm font-medium text-emerald-400/90">
            നിങ്ങളുടെ ഡിജിറ്റൽ കർഷക മിത്രം — കർഷകർക്കായി തത്സമയ സഹായം
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              id="home-start-agent-btn"
              size="lg"
              onClick={onStartAgent}
              className="rounded-full bg-gradient-to-r from-emerald-600 to-green-600 px-8 py-6 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition-all hover:scale-105 hover:from-emerald-500 hover:to-green-500"
            >
              <span className="mr-2 text-lg">🎙️</span> Launch Voice Agent Conversation
            </Button>
          </div>
        </div>
      </section>

      {/* Basic Information & Core Features Grid */}
      <section className="mt-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Key System Capabilities &amp; Features
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything you need to know about how Farm &amp; Field assists farmers
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-emerald-500/40 hover:shadow-md">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl ring-1 ring-emerald-500/20">
              📈
            </div>
            <h3 className="text-lg font-bold text-card-foreground">Market Mandi Prices</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Fetches daily Agmarknet market commodity rates for crops such as Rubber, Coconut, Paddy, Black Pepper, Cardamom, Arecanut, and Banana across Kerala districts.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-emerald-500/40 hover:shadow-md">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl ring-1 ring-blue-500/20">
              🌧️
            </div>
            <h3 className="text-lg font-bold text-card-foreground">Weather &amp; Rain Prediction</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Real-time temperature, precipitation probability, and agricultural weather advice powered by Open-Meteo for Kottayam, Wayanad, Palakkad, Thrissur, and more.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-emerald-500/40 hover:shadow-md">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-purple-500/10 text-2xl ring-1 ring-purple-500/20">
              🗣️
            </div>
            <h3 className="text-lg font-bold text-card-foreground">Bilingual Malayalam &amp; English</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Seamlessly understands Malayalam speech and Manglish keywords. Switches TTS voice dynamically to Nimisha (ml-IN) or Anisha (en-IN) based on input.
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-emerald-500/40 hover:shadow-md">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-2xl ring-1 ring-amber-500/20">
              💾
            </div>
            <h3 className="text-lg font-bold text-card-foreground">Persistent SQLite Memory</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Remembers farmer name, crops grown, land size, and district. Strict consent guardrails ensure facts are saved ONLY after explicit permission.
            </p>
          </div>

          {/* Card 5 */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-emerald-500/40 hover:shadow-md">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-red-500/10 text-2xl ring-1 ring-red-500/20">
              🚨
            </div>
            <h3 className="text-lg font-bold text-card-foreground">Human Escalation Protocol</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Automatically creates structured escalation requests for agricultural experts when missing market data occurs or severe crop disease requires human inspection.
            </p>
          </div>

          {/* Card 6 */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-emerald-500/40 hover:shadow-md">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-indigo-500/10 text-2xl ring-1 ring-indigo-500/20">
              📊
            </div>
            <h3 className="text-lg font-bold text-card-foreground">Call Outcome Dashboard</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Records and tracks every call outcome. Displays real-time counts for Total Calls, Successful Calls, and Failed Calls along with success condition logs.
            </p>
          </div>
        </div>
      </section>

      {/* Guide Section */}
      <section className="mt-12 rounded-3xl border border-border/80 bg-secondary/30 p-6 sm:p-8">
        <h3 className="text-xl font-bold text-foreground">How To Use The Voice Assistant</h3>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          <li className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background/60 p-4">
            <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">1</span>
            <h4 className="font-semibold text-sm">Start Conversation</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Click on the <strong>Agent</strong> tab or button above, grant microphone permission, and begin speaking to the AI assistant.
            </p>
          </li>
          <li className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background/60 p-4">
            <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">2</span>
            <h4 className="font-semibold text-sm">Ask Farming Questions</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ask about market prices (e.g., &quot;What is today&apos;s rubber price in Kottayam?&quot;), weather forecasts, or crop protection advice.
            </p>
          </li>
          <li className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background/60 p-4">
            <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">3</span>
            <h4 className="font-semibold text-sm">Review Call Outcome</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When the call ends, inspect its outcome (Successful or Failed) on the <strong>Dashboard</strong> tab, where all numbers are recorded in real-time.
            </p>
          </li>
        </ol>
      </section>
    </div>
  );
}
