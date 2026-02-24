import React, { useState } from 'react';
import { useDayInsights } from '../../hooks/useDayInsights';

const DAYS = [1, 2, 3, 4, 5, 6, 7];

function InsightCard({ card, featured }) {
  return (
    <div className={`theme-card${featured ? ' featured' : ''}`}>
      <div className="theme-tag tag-community">💬 Community</div>
      <h3>{card.title}</h3>
      <p>{card.body}</p>
      <div className="theme-meta">
        <span>💬 {card.source_count} community posts</span>
      </div>
    </div>
  );
}

export default function CommunityTab() {
  const [selectedDay, setSelectedDay] = useState(1);
  const { cards, loading } = useDayInsights(selectedDay);

  const dayLabel = d => d === 7 ? 'Day 7+' : `Day ${d}`;

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

      {/* Day picker */}
      <div className="day-picker" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {DAYS.map(d => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`day-nav-btn${selectedDay === d ? ' active' : ''}`}
          >
            {dayLabel(d)}
          </button>
        ))}
      </div>

      {loading && (
        <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Loading...</p>
      )}

      {!loading && cards?.length > 0 && (
        <div className="themes-grid">
          {cards.map((card, i) => (
            <InsightCard key={i} card={card} featured={i === 0} />
          ))}
        </div>
      )}

      {!loading && cards?.length === 0 && (
        <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>
          No insights yet for {dayLabel(selectedDay)}.
        </p>
      )}
    </div>
  );
}
