import React, { useState } from 'react';
import SpreadsheetView from '../divya/SpreadsheetView';
import ChartView from '../divya/ChartView';
import FollicleViz from '../divya/FollicleViz';

const VIEWS = [
  { id: 'spreadsheet', label: 'Spreadsheet'    },
  { id: 'chart',       label: 'Line Chart'      },
  { id: 'follicles',   label: 'Follicle Growth' },
];

// ── Cycle meta ────────────────────────────────────────────────────────────────

const META_TOP = [
  { label: 'Clinic',       value: 'RMANY, NYC'     },
  { label: 'Dates',        value: 'Mar 4–14, 2024' },
  { label: 'Stim days',    value: '10 days'        },
  { label: 'Baseline AFC', value: '13R · 12L'      },
  { label: 'AMH',          value: '3.52 ng/mL'     },
];

const META_BOTTOM = [
  { label: 'Eggs retrieved', value: '14' },
  { label: 'Embryos frozen', value: '5'  },
];

// ── Main tab ──────────────────────────────────────────────────────────────────

export default function DivyaTab({ onNavigate }) {
  const [view, setView] = useState('spreadsheet');

  return (
    <div className="story-page">

      <h2 className="story-intro-heading">Hey, I'm Divya.</h2>
      <img
        src={process.env.PUBLIC_URL + '/divya-retrieval.jpg'}
        alt="Divya on retrieval day"
        className="story-intro-photo"
      />

      <p className="story-lede">
        I was 29, sitting in the RE's office with a notebook full of questions I didn't know how
        to ask. I didn't know what AMH was three weeks earlier. I just knew I wanted options —
        and that nobody was going to hand me a roadmap for this journey.
      </p>
      <p className="story-lede">
        I hadn't even signed my marriage certificate yet, but my fiancé and I had to decide
        custody of the embryos we were going to freeze — in various situations. Situations I
        wasn't ready to think about, but had to.
      </p>
      <p className="story-lede">
        I just wish I knew what to expect, and how to navigate the journey with my RE. But I had
        to figure everything out on my own.
      </p>

      <p className="story-transition">
        Here is what my journey looked like: the medications I took, the lab numbers I got, and
        the number of eggs retrieved — all the way down to the embryos we finally froze.
      </p>

      <div className="story-meta-bar">
        <div className="story-meta-row">
          {META_TOP.map(s => (
            <div key={s.label} className="story-meta-stat">
              <div className="story-meta-label">{s.label}</div>
              <div className="story-meta-value">{s.value}</div>
            </div>
          ))}
        </div>
        <div className="story-meta-row story-meta-row--bottom">
          {META_BOTTOM.map(s => (
            <div key={s.label} className="story-meta-stat">
              <div className="story-meta-label">{s.label}</div>
              <div className="story-meta-value">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="view-toggle" style={{ marginTop: 32 }}>
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

      <div className="story-closing">
        <p className="story-closing-quote">
          That's just my story. Yours will look different — different numbers, different
          decisions, different fears. But you shouldn't have to figure it out alone. That's why
          I built WTF — What the Fertility.
        </p>
        <button
          className="story-cta-btn"
          onClick={() => onNavigate && onNavigate('journeys')}
        >
          See your roadmap →
          <span className="story-cta-sub">created from experiences of women who've been there</span>
        </button>
      </div>

    </div>
  );
}
