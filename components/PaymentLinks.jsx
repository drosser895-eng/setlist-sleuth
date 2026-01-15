import React from 'react';

export default function PaymentLinks({ paymentLinks = {} }) {
  const links = [
    { key: 'paypal', label: 'Tip via PayPal' },
    { key: 'kofi', label: 'Buy a coffee on Ko‑fi' },
    { key: 'patreon', label: 'Support on Patreon' },
    { key: 'cashapp', label: 'Tip via CashApp' },
    { key: 'venmo', label: 'Tip via Venmo' },
    { key: 'other', label: 'More ways to support' }
  ];

  return (
    <div className="creator-payments" style={{ padding: 12, background: '#fff', borderRadius: 6 }}>
      <h3>Support this artist</h3>
      <p>If you enjoy this track, tip directly to the artist (we do not handle payouts):</p>
      <ul>
        {links.map((l) => {
          const value = paymentLinks[l.key];
          if (!value) return null;
          // If CashApp user handle provided without http, prefix properly
          const prefix = (l.key === 'cashapp' && !value.startsWith('http')) ? 'https://cash.app/$' : '';
          const href = (value.startsWith('http')) ? value : `${prefix}${value}`;
          return (
            <li key={l.key}>
              <a href={href} target="_blank" rel="noopener noreferrer">{l.label}</a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
