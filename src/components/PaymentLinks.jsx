import React from 'react';

export default function PaymentLinks({ paymentLinks = {} }) {
  const links = [
    { type: 'paypal', url: paymentLinks.paypal, label: 'PayPal' },
    { type: 'kofi', url: paymentLinks.kofi, label: 'Ko-fi' },
    { type: 'patreon', url: paymentLinks.patreon, label: 'Patreon' },
    { type: 'cashapp', url: paymentLinks.cashapp, label: 'Cash App' },
    { type: 'venmo', url: paymentLinks.venmo, label: 'Venmo' },
  ].filter(link => link.url);

  if (links.length === 0) return null;

  return (
    <div className="payment-links" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
      {links.map(link => (
        <a 
          key={link.type} 
          href={link.url} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            padding: '8px 12px', 
            borderRadius: '4px', 
            background: '#eee', 
            color: '#333', 
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          Tip via {link.label}
        </a>
      ))}
    </div>
  );
}
