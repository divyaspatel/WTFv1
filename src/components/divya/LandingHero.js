import React from 'react';

const FEATURES = [
  {
    icon: '🔬',
    title: 'Real data from a real cycle',
    body: 'See exactly what Divya tracked during her 10-day egg freezing cycle: every follicle size, E2 level, medication dose, and symptom — day by day, number by number.',
    tag: 'Start Here tab',
  },
  {
    icon: '📋',
    title: 'Track your own journey',
    body: 'Set up your medication protocol, log daily monitoring visits, record your mood, and keep a daily journal. Your private data is synced to your account.',
    tag: 'Your Journey tab',
  },
  {
    icon: '💬',
    title: 'What other women felt',
    body: '973 real Reddit posts from r/IVF and r/eggfreezing, synthesized by AI into daily insights — what women actually experienced on Day 3, Day 5, and beyond.',
    tag: 'Community tab',
  },
];

export default function LandingHero() {
  return (
    <div className="landing-hero">
      <div className="landing-hero-inner">
        <div className="landing-eyebrow">WTF · what the fertility</div>
        <h1 className="landing-headline">
          You don't have to figure<br />this out alone.
        </h1>
        <p className="landing-subheadline">
          Real data, real tools, real community — everything you wish someone had
          given you before starting your fertility journey.
        </p>

        <div className="landing-features">
          {FEATURES.map((f, i) => (
            <div key={i} className="landing-feature-card">
              <div className="landing-feature-icon">{f.icon}</div>
              <div className="landing-feature-tag">{f.tag}</div>
              <h3 className="landing-feature-title">{f.title}</h3>
              <p className="landing-feature-body">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="landing-divider">
          <span>Start with Divya's story below</span>
        </div>
      </div>
    </div>
  );
}
