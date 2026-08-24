import React from 'react';
type CurrencyFormatterProps = {
  amount: number;
  currency?: string;
  locale?: string;
};

export const CurrencyFormatter: React.FC<CurrencyFormatterProps> = ({
  amount,
  currency = 'USD',
  locale = 'en-US',
}) => {
  const formattedAmount = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount ?? 0);

  return <span>{formattedAmount}</span>;
};
