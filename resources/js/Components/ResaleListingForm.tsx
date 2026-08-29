// resources/js/Components/ResaleListingForm.tsx

import { useState } from 'react';
import { router } from '@inertiajs/react';

interface Props {
  ticketId: number;
  isOwner: boolean;
  ticketStatus: 'valid' | 'listed' | 'used' | 'void';
  stripeAccountActive: boolean;
  activeListing: { id: number; price: string } | null;
}

export default function ResaleListingForm({
  ticketId,
  isOwner,
  ticketStatus,
  stripeAccountActive,
  activeListing,
}: Props) {
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOwner) return null;

  if (ticketStatus === 'used' || ticketStatus === 'void') {
    return null;
  }

  // GET is correct here because /resale/connect is a GET route.
  function connectPayouts() {
    window.location.href = route('resale.connect', { ticket: ticketId });
  }

  // POST is required here because /tickets/{ticket}/resell
  // is registered as POST.
  function listTicket() {
    const value = parseFloat(price);

    if (!value || value <= 0 || submitting) {
      return;
    }

    setSubmitting(true);

    router.post(
      route('resale.store', {
        ticket: ticketId,
      }),
      {
        price: value,
      },
      {
        preserveScroll: true,
        onFinish: () => {
          setSubmitting(false);
        },
      }
    );
  }

  function cancelListing() {
    if (!activeListing || submitting) return;

    if (
      !confirm(
        'Cancel this resale listing? Your ticket will become valid and scannable again.'
      )
    ) {
      return;
    }

    setSubmitting(true);

    router.delete(
      route('resale.destroy', {
        listing: activeListing.id,
      }),
      {
        preserveScroll: true,
        onFinish: () => {
          setSubmitting(false);
        },
      }
    );
  }

  // ─────────────────────────────────────────────
  // ALREADY LISTED
  // ─────────────────────────────────────────────

  if (activeListing) {
    return (
      <div className="mt-5 rounded-xl border border-red-800 bg-red-950/80 p-5">
        <p className="text-sm font-semibold text-red-300">
          Ticket listed for resale
        </p>

        <p className="mt-1 text-sm text-red-200/80">
          Listed price: ${activeListing.price}
        </p>

        <p className="mt-2 text-xs text-red-300/70">
          This ticket cannot be scanned while it is listed.
          Cancel the listing if you want to use the ticket again.
        </p>

        <button
          type="button"
          onClick={cancelListing}
          disabled={submitting}
          className="mt-4 rounded-lg border border-red-600 bg-red-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Cancelling...' : 'Cancel resale'}
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // PAYOUT ACCOUNT NOT CONNECTED
  // ─────────────────────────────────────────────

  if (!stripeAccountActive) {
    return (
      <div className="mt-5 rounded-xl border border-red-800 bg-red-950/80 p-5">
        <p className="text-sm font-semibold text-white">
          Want to resell this ticket?
        </p>

        <p className="mt-1 text-xs leading-5 text-red-200/80">
          Set up your seller payouts first. We need a connected payout
          account so we can send you the money when your ticket sells.
        </p>

        <button
          type="button"
          onClick={connectPayouts}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
        >
          Set up payouts
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // READY TO LIST
  // ─────────────────────────────────────────────

  return (
    <div className="mt-5 rounded-xl border border-red-800 bg-red-950/80 p-5">
      <p className="text-sm font-semibold text-white">
        Resell this ticket
      </p>

      <p className="mt-1 mb-4 text-xs leading-5 text-red-200/80">
        Set your resale price. Once another buyer purchases it,
        ownership will transfer to them and your current ticket
        code will stop working.
      </p>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-red-300">
            $
          </span>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Resale price"
            disabled={submitting}
            className="w-full rounded-lg border border-red-800 bg-black/40 py-2.5 pl-7 pr-3 text-sm text-white placeholder:text-red-300/40 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        <button
          type="button"
          onClick={listTicket}
          disabled={submitting || !price}
          className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? 'Listing...' : 'List ticket'}
        </button>
      </div>
    </div>
  );
}
