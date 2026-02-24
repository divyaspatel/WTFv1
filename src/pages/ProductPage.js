import React, { useState } from 'react';
import DivyaTab from '../components/tabs/DivyaTab';
import CommunityTab from '../components/tabs/CommunityTab';

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
      {activeTab === 'others'  && <CommunityTab />}
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
