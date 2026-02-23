import React, { useState } from 'react';
import insights from '../data/insights.json';
import DivyaTab from '../components/tabs/DivyaTab';

const TABS = [
  { id: 'story',   label: "✨ Start Here — Divya's Story" },
  { id: 'journey', label: "Your Journey"                   },
  { id: 'others',  label: "What Others Are Saying"         },
];

export default function ProductPage() {
  const [activeTab, setActiveTab] = useState('story');

  return (
    <>
      <div className="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'story'   && <DivyaTab />}
      {activeTab === 'journey' && <JourneyTab />}
      {activeTab === 'others'  && <OthersTab />}
    </>
  );
}

function JourneyTab() {
  return (
    <div className="tab-content">
      <div className="journey-header">
        <h1>Your Journey</h1>
        <p>Your day-by-day cycle tracker — coming soon.</p>
      </div>
      <div className="chat-intro">
        <div className="chat-date-divider">Coming Soon</div>
        <div className="chat-bubble-row from-divya">
          <div className="chat-avatar-small">💬</div>
          <div className="chat-bubble her">
            Track your cycle day by day — medications, monitoring results, how you're feeling. This is your space. 🌸
          </div>
        </div>
      </div>
    </div>
  );
}

function OthersTab() {
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
