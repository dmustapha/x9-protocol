'use client';

import { useState } from 'react';

export default function StrategyInput({ onSubmit }: { onSubmit: (name: string, strategy: string) => Promise<void> }) {
  const [name, setName] = useState('');
  const [strategy, setStrategy] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Agent Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Trading Agent"
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:border-[var(--accent)] outline-none"
        />
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-2">Describe your trading strategy</label>
        <textarea
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          placeholder="Trade SOL and USDC. Be conservative. Max $100 a day, stop if I'm down 15%."
          rows={4}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:border-[var(--accent)] outline-none resize-none"
        />
        <p className="text-xs text-zinc-600 mt-2">
          Claude will convert this into enforceable Swig policy rules. You'll review before signing.
        </p>
      </div>

      <button
        onClick={async () => {
          if (!name || !strategy) return;
          setLoading(true);
          await onSubmit(name, strategy);
          setLoading(false);
        }}
        disabled={!name || !strategy || loading}
        className="w-full py-3 bg-[var(--accent)] text-black font-semibold rounded-lg hover:brightness-110 disabled:opacity-50"
      >
        {loading ? 'Converting strategy...' : 'Generate Policy'}
      </button>
    </div>
  );
}
