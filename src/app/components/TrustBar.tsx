import React from 'react';
import Icon from '@/components/ui/AppIcon';

const items = [
  { icon: 'GiftIcon', title: 'Premium Quality', subtitle: 'Handpicked with love' },
  { icon: 'TruckIcon', title: 'Fast & Secure Shipping', subtitle: 'Delivery to your doorstep' },
  { icon: 'ShieldCheckIcon', title: 'Safe Payments', subtitle: '100% secure checkout' },
  { icon: 'HeartIcon', title: 'Made with Love', subtitle: 'Just for you' },
];

export default function TrustBar() {
  return (
    <section
      className="w-full border-t"
      style={{ background: 'var(--blush-bg)', borderColor: 'var(--blush-border)' }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-10 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
        {items.map((item) => (
          <div key={item.title} className="flex items-center gap-3">
            <Icon
              name={item.icon}
              size={26}
              style={{ color: 'var(--blush-text)' }}
              className="shrink-0"
            />
            <div>
              <p className="text-sm font-bold leading-tight" style={{ color: 'var(--blush-text)' }}>
                {item.title}
              </p>
              <p className="text-xs leading-tight mt-0.5" style={{ color: 'var(--blush-muted)' }}>
                {item.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
