'use client';

import { useMemo, useState } from 'react';

import { TokenSource } from 'livekit-client';
import { useSession } from '@livekit/components-react';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import type { AppConfig } from '@/app-config';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { StartAudioButton } from '@/components/agents-ui/start-audio-button';
import { DashboardView } from '@/components/app/dashboard-view';
import { HomeView } from '@/components/app/home-view';
import { Navbar, type NavTab } from '@/components/app/navbar';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/ui/sonner';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';
import { getSandboxTokenSource } from '@/lib/utils';

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

function AppSetup() {
  useDebugMode({ enabled: IN_DEVELOPMENT });
  useAgentErrors();

  return null;
}

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  const tokenSource = useMemo(() => {
    return typeof process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT === 'string'
      ? getSandboxTokenSource(appConfig)
      : TokenSource.endpoint('/api/token');
  }, [appConfig]);

  const session = useSession(
    tokenSource,
    appConfig.agentName ? { agentName: appConfig.agentName } : undefined
  );

  return (
    <AgentSessionProvider session={session}>
      <AppSetup />
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        {/* Navigation Bar */}
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Single Integrated Page Content Views */}
        <main className="flex-1 w-full pb-16">
          {activeTab === 'home' && (
            <HomeView onStartAgent={() => setActiveTab('agent')} />
          )}

          {activeTab === 'agent' && (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
              <ViewController
                appConfig={appConfig}
                onGoToDashboard={() => setActiveTab('dashboard')}
              />
            </div>
          )}

          {activeTab === 'dashboard' && <DashboardView />}
        </main>
      </div>

      <StartAudioButton label="Start Audio" />
      <Toaster
        icons={{
          warning: <WarningIcon weight="bold" />,
        }}
        position="top-center"
        className="toaster group"
        style={
          {
            '--normal-bg': 'var(--popover)',
            '--normal-text': 'var(--popover-foreground)',
            '--normal-border': 'var(--border)',
          } as React.CSSProperties
        }
      />
    </AgentSessionProvider>
  );
}

