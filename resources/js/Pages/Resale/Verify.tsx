// resources/js/Pages/Resale/Verify.tsx
//
// Public, no-login page: paste a ticket code, get back ONLY its status
// — never owner PII. This is the tool a buyer uses BEFORE paying a
// stranger off-platform, since that's the only point in the whole
// scam where intervention is actually possible (see conversation:
// nothing can reach into a private DM/cash conversation after the
// fact — this has to happen before money moves).

import { useState, FormEventHandler } from 'react';
import { Head } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface CheckResult {
  status:
    | 'verified_original'
    | 'verified_resold'
    | 'listed_for_resale'
    | 'already_used'
    | 'void'
    | 'not_found'
    | 'unknown';
  message: string;
  event_name?: string;
  venue_name?: string;
  event_date?: string;
  tier_name?: string;
}

const RESULT_STYLE: Record<CheckResult['status'], { color: string; icon: 'ok' | 'warn' | 'bad' }> = {
  verified_original: { color: 'emerald', icon: 'ok' },
  verified_resold: { color: 'emerald', icon: 'ok' },
  listed_for_resale: { color: 'amber', icon: 'warn' },
  already_used: { color: 'red', icon: 'bad' },
  void: { color: 'red', icon: 'bad' },
  not_found: { color: 'red', icon: 'bad' },
  unknown: { color: 'neutral', icon: 'warn' },
};

const COLOR_CLASSES: Record<string, string> = {
  emerald: 'bg-emerald-950/30 border-emerald-900 text-emerald-300',
  amber: 'bg-amber-950/30 border-amber-900 text-amber-300',
  red: 'bg-red-950/30 border-red-900 text-red-300',
  neutral: 'bg-neutral-900 border-neutral-800 text-neutral-300',
};

export default function Verify() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit: FormEventHandler = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(route('verify.check'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN':
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = (await response.json()) as CheckResult;
      setResult(data);
    } catch {
      setError('Could not check this code right now — try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title="Verify a ticket" />

      <div className="min-h-screen bg-[#0B0B10] text-[#F7F5F2] flex items-start justify-center px-4 py-16">
        <div className="w-full max-w-3xl">
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Before you pay</p>
          <h1 className="text-2xl font-semibold mb-3">Verify a ticket</h1>
          <p className="text-sm text-neutral-400 mb-8">
            Buying a ticket from someone off this platform? Paste the code shown on their ticket
            below to check it's actually valid before you send any money.
          </p>

          <form onSubmit={submit} className="flex gap-2 mb-6">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. AB12-CD34-EF56"
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="px-5 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-40"
            >
              {loading ? 'Checking…' : 'Check'}
            </button>
          </form>

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          {result && (
            <div className={`rounded-xl border p-5 ${COLOR_CLASSES[RESULT_STYLE[result.status].color]}`}>
              <p className="font-semibold text-sm mb-1.5">{result.message}</p>

              {result.event_name && (
                <div className="text-xs opacity-80 mt-3 space-y-0.5">
                  <p>{result.event_name}</p>
                  {result.venue_name && <p>{result.venue_name}</p>}
                  {result.tier_name && <p>{result.tier_name}</p>}
                </div>
              )}
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-neutral-800 text-xs text-neutral-500 space-y-2">
            <p className="text-neutral-400 font-medium">A few things worth knowing:</p>
            <p>
              A screenshot of a valid ticket can still be shown to you by someone who no longer
              owns it, or who's selling the same screenshot to other people too. Checking here
              tells you the ticket's real, current status — not just whether the image looks
              real.
            </p>
            <p>
              The only way a resale actually transfers ownership is through a listing on this
              platform. If someone asks you to pay them directly and just "send the ticket after,"
              that does not transfer anything — don't pay.
            </p>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
