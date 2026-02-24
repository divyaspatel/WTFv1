import React, { useState } from 'react';
import DivyaTab from '../components/tabs/DivyaTab';
import JourneyTab from '../components/tabs/JourneyTab';
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
