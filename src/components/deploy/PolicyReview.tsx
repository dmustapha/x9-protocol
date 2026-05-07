'use client';

import type { ActionConfig } from '@/types';
import PolicyPanel from '@/components/dashboard/PolicyPanel';

export default function PolicyReview({
  strategy,
  rules,
  onConfirm,
  onBack,
}: {
  strategy: string;
  rules: ActionConfig[];
  onConfirm: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="text-sm text-zinc-400 mb-2">Your strategy:</div>
        <div className="text-sm italic">"{strategy}"</div>
      </div>

      <div>
        <div className="text-sm text-zinc-400 mb-2">Generated policy rules:</div>
        <PolicyPanel rules={rules} />
      </div>

      <p className="text-xs text-zinc-500">
        These rules will be enforced at the transaction layer via Swig. Your agent cannot exceed them.
        You'll sign this policy with Phantom — that signature is the onchain commitment.
      </p>

      <div className="flex gap-4">
        <button onClick={onBack} className="flex-1 py-3 border border-zinc-700 rounded-lg hover:bg-zinc-900">
          Back
        </button>
        <button onClick={onConfirm} className="flex-1 py-3 bg-[var(--accent)] text-black font-semibold rounded-lg hover:brightness-110">
          Approve & Sign
        </button>
      </div>
    </div>
  );
}
