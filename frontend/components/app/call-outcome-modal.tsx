'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shadcn/utils';

interface CallOutcomeModalProps {
  isOpen: boolean;
  callId: string;
  durationSeconds: number;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export function CallOutcomeModal({
  isOpen,
  callId,
  durationSeconds,
  onClose,
  onSaveSuccess,
}: CallOutcomeModalProps) {
  const [outcome, setOutcome] = useState<'successful' | 'failed'>(
    durationSeconds >= 10 ? 'successful' : 'failed'
  );
  const [successCondition, setSuccessCondition] = useState<string>(
    durationSeconds >= 10
      ? 'Query resolved (market/weather data provided)'
      : 'Call ended prematurely (<10s)'
  );
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_id: callId || `CALL_${Date.now()}`,
          outcome,
          success_condition: successCondition,
          user_id: 'FF001',
          caller_name: 'Farmer',
          duration_seconds: durationSeconds,
          notes,
        }),
      });
      onSaveSuccess();
    } catch (err) {
      console.error('Failed to save call outcome:', err);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📞</span>
            <div>
              <h3 className="text-lg font-bold text-foreground">Record Call Outcome</h3>
              <p className="text-xs text-muted-foreground font-mono">
                Call ID: <span className="text-emerald-400">{callId}</span> • Duration: {durationSeconds}s
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {/* Outcome Selection Buttons */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Select Call Outcome *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setOutcome('successful');
                  setSuccessCondition('Query resolved (market/weather data provided)');
                }}
                className={cn(
                  'flex flex-col items-center justify-center rounded-2xl border p-4 transition-all',
                  outcome === 'successful'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 ring-2 ring-emerald-500/40 shadow-lg'
                    : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/60'
                )}
              >
                <span className="text-2xl mb-1">✅</span>
                <span className="text-sm font-bold">Successful Call</span>
                <span className="text-[11px] text-emerald-400/80 mt-0.5">Condition Achieved</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOutcome('failed');
                  setSuccessCondition('Call did not reach success condition');
                }}
                className={cn(
                  'flex flex-col items-center justify-center rounded-2xl border p-4 transition-all',
                  outcome === 'failed'
                    ? 'border-red-500 bg-red-500/15 text-red-400 ring-2 ring-red-500/40 shadow-lg'
                    : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/60'
                )}
              >
                <span className="text-2xl mb-1">❌</span>
                <span className="text-sm font-bold">Failed Call</span>
                <span className="text-[11px] text-red-400/80 mt-0.5">Condition Unmet</span>
              </button>
            </div>
          </div>

          {/* Success Condition Dropdown / Text */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Success Condition / Reason
            </label>
            <select
              value={successCondition}
              onChange={(e) => setSuccessCondition(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {outcome === 'successful' ? (
                <>
                  <option value="Query resolved (market/weather data provided)">
                    Query resolved (market/weather data provided)
                  </option>
                  <option value="Farmer profile & facts stored with consent">
                    Farmer profile &amp; facts stored with consent
                  </option>
                  <option value="Human escalation request successfully submitted">
                    Human escalation request successfully submitted
                  </option>
                  <option value="General agricultural advisory delivered">
                    General agricultural advisory delivered
                  </option>
                </>
              ) : (
                <>
                  <option value="Call did not reach success condition">
                    Call did not reach success condition
                  </option>
                  <option value="Call disconnected prematurely (<10s)">
                    Call disconnected prematurely (&lt;10s)
                  </option>
                  <option value="Farmer query unfulfilled / missing data without escalation consent">
                    Farmer query unfulfilled / missing data without escalation consent
                  </option>
                  <option value="Call ended before user interaction">
                    Call ended before user interaction
                  </option>
                </>
              )}
            </select>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Additional Call Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Farmer asked about rubber mandi rates in Kottayam"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border/60 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-full text-xs"
          >
            Skip
          </Button>
          <Button
            size="sm"
            disabled={isSubmitting}
            onClick={handleSave}
            className="rounded-full bg-emerald-600 font-bold text-white hover:bg-emerald-500 text-xs px-5"
          >
            {isSubmitting ? 'Saving...' : '💾 Save Call Record'}
          </Button>
        </div>
      </div>
    </div>
  );
}
