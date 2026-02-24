import React from 'react';
import insights from '../../data/insights.json';

function InsightCard({ item, featured }) {
  return (
    <div className={`theme-card${featured ? ' featured' : ''}`}>
      <div className="theme-tag tag-community">{item.icon} {item.topic}</div>
      <h3>{item.question}</h3>
      <p>{item.insight}</p>
      <div className="theme-meta">
        <span>💬 {item.post_count} community posts</span>
      </div>
    </div>
  );
}

export default function CommunityTab() {
  if (!insights.length) {
    return (
      <div className="tab-content">
        <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>
          Run <code>python3 analyze.py</code> in the scraper directory to generate community insights.
        </p>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="community-header">
        <h1>What <em>Others</em> Are Saying</h1>
        <p>Real insights from r/IVF, r/eggfreezing, and r/fertility</p>
        <div className="last-updated">
          <div className="live-dot" />
          Updated weekly from community posts
        </div>
      </div>
      <div className="themes-grid">
        {insights.map((item, i) => (
          <InsightCard key={item.id} item={item} featured={i === 0} />
        ))}
      </div>
    </div>
  );
}
