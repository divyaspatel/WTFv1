import React, { useState } from 'react';
import ChatIntro from '../divya/ChatIntro';
import CycleSummaryCard from '../divya/CycleSummaryCard';
import SpreadsheetView from '../divya/SpreadsheetView';
import ChartView from '../divya/ChartView';
import FollicleViz from '../divya/FollicleViz';

const VIEWS = [
  { id: 'spreadsheet', label: 'Spreadsheet'     },
  { id: 'chart',       label: 'Line Chart'       },
  { id: 'follicles',   label: 'Follicle Growth'  },
];

export default function DivyaTab() {
  const [view, setView] = useState('spreadsheet');

  return (
    <div className="tab-content">
      <ChatIntro />
      <CycleSummaryCard />

      <div className="view-toggle">
        {VIEWS.map(v => (
          <button
            key={v.id}
            className={`view-toggle-btn${view === v.id ? ' active' : ''}`}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'spreadsheet' && <SpreadsheetView />}
      {view === 'chart'       && <ChartView />}
      {view === 'follicles'   && <FollicleViz />}
    </div>
  );
}
