'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shadcn/utils';

interface CallStats {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  success_rate: number;
}

interface CallRecord {
  call_id: string;
  user_id: string;
  caller_name: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  outcome: 'successful' | 'failed';
  success_condition: string;
  notes: string;
  created_at: string;
}

interface EscalationRecord {
  ref_id: string;
  reason: string;
  what_happened: string;
  caller_name: string;
  caller_lang: string;
  follow_up_pref: string;
  already_checked: string;
  crop: string;
  district: string;
  urgency: string;
  status: 'open' | 'resolved';
  created_at: string;
}

export function DashboardView() {
  const [stats, setStats] = useState<CallStats>({
    total_calls: 0,
    successful_calls: 0,
    failed_calls: 0,
    success_rate: 0,
  });

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);
  const [callFilter, setCallFilter] = useState<'all' | 'successful' | 'failed'>('all');
  const [escFilter, setEscFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'calls' | 'escalations'>('calls');

  const loadData = useCallback(async () => {
    try {
      const [statsRes, callsRes, escRes] = await Promise.all([
        fetch('/api/calls/stats'),
        fetch('/api/calls'),
        fetch('/api/escalations'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (callsRes.ok) {
        const callsData = await callsRes.json();
        setCalls(callsData);
      }

      if (escRes.ok) {
        const escData = await escRes.json();
        setEscalations(escData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleToggleCallOutcome = async (callId: string, currentOutcome: string) => {
    const newOutcome = currentOutcome === 'successful' ? 'failed' : 'successful';
    const newCondition =
      newOutcome === 'successful'
        ? 'Manually marked as resolved by operator'
        : 'Manually marked as failed by operator';

    try {
      await fetch(`/api/calls/${callId}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome: newOutcome, success_condition: newCondition }),
      });
      loadData();
    } catch (err) {
      console.error('Failed to toggle call outcome:', err);
    }
  };

  const handleResolveEscalation = async (refId: string) => {
    try {
      await fetch(`/api/escalations/${refId}/resolve`, { method: 'POST' });
      loadData();
    } catch (err) {
      console.error('Failed to resolve escalation:', err);
    }
  };

  const filteredCalls =
    callFilter === 'all' ? calls : calls.filter((c) => c.outcome === callFilter);

  const filteredEscalations =
    escFilter === 'all'
      ? escalations
      : escalations.filter((e) => e.status === escFilter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-400 mb-2">
            <span>📊</span> Live Operational Analytics
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Farm &amp; Field Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time call outcome tracking, success metrics, and human escalations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="rounded-full text-xs font-semibold"
          >
            ↻ Refresh Data
          </Button>
          <span className="text-[11px] text-muted-foreground font-mono">
            Auto-refreshes every 15s
          </span>
        </div>
      </div>

      {/* MANDATORY THREE NUMBERS DISPLAY */}
      <section className="mb-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {/* Number 1: Total Calls */}
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-card to-card p-6 shadow-md ring-1 ring-blue-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Total Calls
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/20 text-lg">
              📞
            </div>
          </div>
          <div className="mt-3 text-4xl font-extrabold tracking-tight text-blue-400">
            {stats.total_calls}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            All calls handled by the voice system
          </p>
        </div>

        {/* Number 2: Successful Calls */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-card to-card p-6 shadow-md ring-1 ring-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Successful Calls
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/20 text-lg">
              ✅
            </div>
          </div>
          <div className="mt-3 text-4xl font-extrabold tracking-tight text-emerald-400">
            {stats.successful_calls}
          </div>
          <p className="mt-1 text-[11px] text-emerald-400/80 font-medium">
            Reached success condition
          </p>
        </div>

        {/* Number 3: Failed Calls */}
        <div className="relative overflow-hidden rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-card to-card p-6 shadow-md ring-1 ring-rose-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Failed Calls
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/20 text-lg">
              ❌
            </div>
          </div>
          <div className="mt-3 text-4xl font-extrabold tracking-tight text-rose-400">
            {stats.failed_calls}
          </div>
          <p className="mt-1 text-[11px] text-rose-400/80 font-medium">
            Unmet condition / Disconnected
          </p>
        </div>

        {/* Extra KPI: Success Rate */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-card to-card p-6 shadow-md ring-1 ring-amber-500/20 sm:col-span-3 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Success Rate
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/20 text-lg">
              🎯
            </div>
          </div>
          <div className="mt-3 text-4xl font-extrabold tracking-tight text-amber-400">
            {stats.success_rate}%
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {stats.successful_calls} out of {stats.total_calls} calls resolved
          </p>
        </div>
      </section>

      {/* Call Condition Notice Banner */}
      <div className="mb-8 rounded-2xl border border-border/80 bg-secondary/30 p-4 text-xs leading-relaxed text-muted-foreground flex items-start gap-3">
        <span className="text-lg">💡</span>
        <div>
          <span className="font-bold text-foreground">Understanding Call Outcomes:</span> A call is recorded as <strong>Successful</strong> when the caller&apos;s request is satisfied (market price delivered, weather prediction given, profile saved, or human escalation created). A call is recorded as <strong>Failed</strong> when the condition is unmet or the call ends prematurely.
        </div>
      </div>

      {/* Sub-Tab Controls (Call Logs vs Human Escalations) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('calls')}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-bold transition-all',
              activeSubTab === 'calls'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-secondary/40 text-muted-foreground hover:bg-secondary'
            )}
          >
            📞 Call Log &amp; Outcome Records ({calls.length})
          </button>
          <button
            onClick={() => setActiveSubTab('escalations')}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-bold transition-all',
              activeSubTab === 'escalations'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-secondary/40 text-muted-foreground hover:bg-secondary'
            )}
          >
            🚨 Human Escalations ({escalations.length})
          </button>
        </div>

        {/* Filters */}
        {activeSubTab === 'calls' ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground">Filter:</span>
            {(['all', 'successful', 'failed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setCallFilter(f)}
                className={cn(
                  'rounded-full px-3 py-1 text-[11px] font-semibold capitalize transition-all',
                  callFilter === f
                    ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                    : 'text-muted-foreground hover:bg-secondary'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground">Filter:</span>
            {(['all', 'open', 'resolved'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setEscFilter(f)}
                className={cn(
                  'rounded-full px-3 py-1 text-[11px] font-semibold capitalize transition-all',
                  escFilter === f
                    ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                    : 'text-muted-foreground hover:bg-secondary'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CALL LOGS TABLE */}
      {activeSubTab === 'calls' && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-secondary/40 text-muted-foreground font-mono uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Call ID</th>
                <th className="p-3.5">Caller</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Outcome</th>
                <th className="p-3.5">Success Condition / Reason</th>
                <th className="p-3.5">Notes</th>
                <th className="p-3.5">Recorded At</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Loading call records...
                  </td>
                </tr>
              ) : filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No call outcome records found for this filter.
                  </td>
                </tr>
              ) : (
                filteredCalls.map((row) => {
                  const isSuccess = row.outcome === 'successful';
                  return (
                    <tr key={row.call_id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3.5 font-mono text-emerald-400 font-semibold">
                        {row.call_id}
                      </td>
                      <td className="p-3.5 font-medium text-foreground">
                        {row.caller_name || 'Farmer'}
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {row.user_id}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-muted-foreground">
                        {row.duration_seconds}s
                      </td>
                      <td className="p-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                            isSuccess
                              ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30'
                          )}
                        >
                          <span>{isSuccess ? '✅ Successful' : '❌ Failed'}</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-foreground max-w-xs leading-relaxed">
                        {row.success_condition}
                      </td>
                      <td className="p-3.5 text-muted-foreground max-w-xs">
                        {row.notes || '—'}
                      </td>
                      <td className="p-3.5 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                        {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleCallOutcome(row.call_id, row.outcome)}
                          className="rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                        >
                          Toggle Outcome
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* HUMAN ESCALATIONS TABLE */}
      {activeSubTab === 'escalations' && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-secondary/40 text-muted-foreground font-mono uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Ref ID</th>
                <th className="p-3.5">Reason</th>
                <th className="p-3.5">Caller</th>
                <th className="p-3.5">Crop / District</th>
                <th className="p-3.5">What Happened</th>
                <th className="p-3.5">Urgency</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Created</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    Loading escalations...
                  </td>
                </tr>
              ) : filteredEscalations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    No human escalation requests found.
                  </td>
                </tr>
              ) : (
                filteredEscalations.map((row) => {
                  const isResolved = row.status === 'resolved';
                  const isMissing = row.reason === 'missing_market_data';
                  return (
                    <tr key={row.ref_id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3.5 font-mono text-emerald-400 font-semibold">
                        {row.ref_id}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={cn(
                            'inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                            isMissing
                              ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30'
                          )}
                        >
                          {isMissing ? '📊 Missing Price Data' : '🚨 Serious Crop Disease'}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-foreground">
                        {row.caller_name || 'Farmer'}
                        <div className="text-[10px] text-muted-foreground">
                          {row.caller_lang} • {row.follow_up_pref}
                        </div>
                      </td>
                      <td className="p-3.5 text-foreground">
                        {row.crop || '—'}
                        <div className="text-[10px] text-muted-foreground">
                          {row.district || ''}
                        </div>
                      </td>
                      <td className="p-3.5 text-foreground max-w-xs leading-relaxed">
                        {row.what_happened}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={cn(
                            'inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase',
                            row.urgency === 'high'
                              ? 'bg-rose-500/20 text-rose-400'
                              : row.urgency === 'medium'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          )}
                        >
                          {row.urgency}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-[11px] font-bold',
                            isResolved ? 'text-emerald-400' : 'text-amber-400'
                          )}
                        >
                          <span>{isResolved ? '✅ Resolved' : '⏳ Open'}</span>
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                        {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="p-3.5 text-right">
                        <Button
                          disabled={isResolved}
                          size="sm"
                          onClick={() => handleResolveEscalation(row.ref_id)}
                          className={cn(
                            'rounded-lg text-[11px] font-bold h-7 px-3',
                            isResolved
                              ? 'bg-secondary text-muted-foreground'
                              : 'bg-emerald-600 text-white hover:bg-emerald-500'
                          )}
                        >
                          {isResolved ? 'Resolved' : 'Resolve'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
