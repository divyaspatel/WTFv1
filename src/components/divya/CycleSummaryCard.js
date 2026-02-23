import React from 'react';

const stats = [
  { label: 'Clinic',      value: 'RMANY, NYC'     },
  { label: 'Dates',       value: 'Mar 4–14, 2024' },
  { label: 'Stim days',   value: '10 days'         },
  { label: 'Baseline AFC', value: '13R · 12L'      },
];

export default function CycleSummaryCard() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto 28px' }}>
      <div className="info-card" style={{ maxWidth: '100%' }}>
        <div className="info-card-label">📍 Cycle at a glance</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginTop: 4 }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: 14 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
