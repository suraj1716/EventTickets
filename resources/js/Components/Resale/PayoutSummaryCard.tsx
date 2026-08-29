import React from 'react';

interface PayoutSummary {
  stripe_account_active: boolean;
  total_sold: number;
  total_payout_amount: number;
  paid_out_amount: number;
  pending_amount: number;
}

interface PayoutSummaryCardProps {
  payoutSummary: PayoutSummary;
  connectUrl: string;
}

export default function PayoutSummaryCard({ payoutSummary, connectUrl }: PayoutSummaryCardProps) {
  const { stripe_account_active, total_sold, paid_out_amount, pending_amount } = payoutSummary;

  return (
    <div className="rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Payouts</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${stripe_account_active ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {stripe_account_active ? 'Payouts active' : 'Setup required'}
        </span>
      </div>

      {!stripe_account_active && (
        <a href={connectUrl} className="inline-block text-sm text-blue-600 underline mb-3">
          Set up payouts
        </a>
      )}

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Sold</div>
          <div className="font-medium">{total_sold}</div>
        </div>
        <div>
          <div className="text-gray-500">Paid out</div>
          <div className="font-medium">${paid_out_amount.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-500">Pending</div>
          <div className="font-medium">${pending_amount.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
