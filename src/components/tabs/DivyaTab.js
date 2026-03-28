import React, { useState } from 'react';
import { DIVYA_DATA } from '../../data/divyaData';

// ── Cycle meta ────────────────────────────────────────────────────────────────

const META_STATS = [
  { label: 'Clinic',         value: 'RMANY, NYC'     },
  { label: 'Dates',          value: 'Mar 4–14, 2024' },
  { label: 'Stim days',      value: '10 days'        },
  { label: 'Baseline AFC',   value: '13R · 12L'      },
  { label: 'Eggs retrieved', value: '14'             },
  { label: 'Embryos frozen', value: '5'              },
];

// ── Monitoring day cards (6 days with bloodwork + ultrasound) ─────────────────
// E2 + follicle counts from DIVYA_DATA; meds + feelings from SpreadsheetView

const MONITORING_DAYS = [
  {
    day:       'Day 1',
    date:      'Mar 4',
    e2:        31,
    follicles: DIVYA_DATA.folliclesByDay[0].rt.length + DIVYA_DATA.folliclesByDay[0].lt.length,
    meds:      'Gonal-F 200 IU',
    feeling:   null,
  },
  {
    day:       'Day 3',
    date:      'Mar 6',
    e2:        82.84,
    follicles: DIVYA_DATA.folliclesByDay[1].rt.length + DIVYA_DATA.folliclesByDay[1].lt.length,
    meds:      'Gonal-F 150 IU · Menopur 1 vial',
    feeling:   'Sleepy, feeling a little bloated',
  },
  {
    day:       'Day 5',
    date:      'Mar 8',
    e2:        328.6,
    follicles: DIVYA_DATA.folliclesByDay[2].rt.length + DIVYA_DATA.folliclesByDay[2].lt.length,
    meds:      'Gonal-F 150 IU · Menopur 2 vials · Cetrotide 250 mcg',
    feeling:   'Sleepy, emotional — crying from gratitude',
  },
  {
    day:       'Day 7',
    date:      'Mar 10',
    e2:        673.2,
    follicles: DIVYA_DATA.folliclesByDay[3].rt.length + DIVYA_DATA.folliclesByDay[3].lt.length,
    meds:      'Gonal-F 225 IU · Menopur 2 vials · Cetrotide 250 mcg',
    feeling:   'Really gassy waking up, bloated in the morning — more full in the stomach by afternoon',
  },
  {
    day:       'Day 9',
    date:      'Mar 12',
    e2:        1464,
    follicles: DIVYA_DATA.folliclesByDay[4].rt.length + DIVYA_DATA.folliclesByDay[4].lt.length,
    meds:      'Gonal-F 225 IU · Menopur 2 vials · Cetrotide 250 mcg',
    feeling:   'Feeling bloated and tired. Cried after the last shot — feeling very emotional',
  },
  {
    day:       'Day 10',
    date:      'Mar 13',
    e2:        1992,
    follicles: DIVYA_DATA.folliclesByDay[5].rt.length + DIVYA_DATA.folliclesByDay[5].lt.length,
    meds:      'Trigger: Gonal-F 40U + hCG 1.2mL',
    feeling:   'Tired, headache. Feeling better after a walk in the sun',
  },
];

// ── Full 10-day table rows ────────────────────────────────────────────────────
// Sources: SpreadsheetView MedsSheet + HormonesSheet

const ALL_DAYS = [
  { day: 'D1',  date: 'Mar 4',  e2: '31',    follicles: '4',  meds: 'Gonal-F 200 IU'                                       },
  { day: 'D2',  date: 'Mar 5',  e2: '—',     follicles: '—',  meds: 'Gonal-F 200 IU'                                       },
  { day: 'D3',  date: 'Mar 6',  e2: '82.84', follicles: '1',  meds: 'Gonal-F 150 IU · Menopur 1 vial'                      },
  { day: 'D4',  date: 'Mar 7',  e2: '—',     follicles: '—',  meds: 'Gonal-F 150 IU · Menopur 1 vial'                      },
  { day: 'D5',  date: 'Mar 8',  e2: '328.6', follicles: '5',  meds: 'Gonal-F 150 IU · Menopur 2 vials · Cetrotide 250 mcg' },
  { day: 'D6',  date: 'Mar 9',  e2: '—',     follicles: '—',  meds: 'Gonal-F 150 IU · Menopur 2 vials · Cetrotide 250 mcg' },
  { day: 'D7',  date: 'Mar 10', e2: '673.2', follicles: '8',  meds: 'Gonal-F 225 IU · Menopur 2 vials · Cetrotide 250 mcg' },
  { day: 'D8',  date: 'Mar 11', e2: '—',     follicles: '—',  meds: 'Gonal-F 225 IU · Menopur 2 vials · Cetrotide 250 mcg' },
  { day: 'D9',  date: 'Mar 12', e2: '1,464', follicles: '14', meds: 'Gonal-F 225 IU · Menopur 2 vials · Cetrotide 250 mcg' },
  { day: 'D10', date: 'Mar 13', e2: '1,992', follicles: '14', meds: 'Trigger: Gonal-F 40U + hCG 1.2mL'                     },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function DayCard({ day, date, e2, follicles, meds, feeling }) {
  return (
    <div className="story-day-card">
      <div className="day-card-left">
        <div className="day-card-label">{day}</div>
        <div className="day-card-date">{date}</div>
      </div>
      <div className="day-card-body">
        <div className="stat-pills">
          <span className="stat-pill">E2 {e2}</span>
          <span className="stat-pill">{follicles} follicles</span>
          <span className="stat-pill">{meds}</span>
        </div>
        {feeling && <p className="day-feeling"><em>{feeling}</em></p>}
      </div>
    </div>
  );
}

function FullDataTable() {
  return (
    <div className="story-table-wrap">
      <table className="story-data-table">
        <thead>
          <tr>
            <th>Day</th>
            <th>Date</th>
            <th>E2 (pg/mL)</th>
            <th>Follicles</th>
            <th>Medications</th>
          </tr>
        </thead>
        <tbody>
          {ALL_DAYS.map(row => (
            <tr key={row.day}>
              <td>{row.day}</td>
              <td>{row.date}</td>
              <td>{row.e2}</td>
              <td>{row.follicles}</td>
              <td>{row.meds}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export default function DivyaTab({ onNavigate }) {
  const [tableOpen, setTableOpen] = useState(false);

  return (
    <div className="story-page">

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
        {META_STATS.map(s => (
          <div key={s.label} className="story-meta-stat">
            <div className="story-meta-label">{s.label}</div>
            <div className="story-meta-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="story-day-grid">
        {MONITORING_DAYS.map(d => (
          <DayCard key={d.day} {...d} />
        ))}
      </div>

      <div className="story-table-section">
        <button
          className="story-table-toggle-btn"
          onClick={() => setTableOpen(o => !o)}
        >
          {tableOpen ? '▼' : '▶'} Full data table (all 10 days)
        </button>
        {tableOpen && <FullDataTable />}
      </div>

      <div className="story-closing">
        <p className="story-closing-quote">
          "That's just my story. Yours will look different — different numbers, different
          decisions, different fears. But you shouldn't have to figure it out alone. That's why
          I built WTF — What the Fertility."
        </p>
        <button
          className="story-cta-btn"
          onClick={() => onNavigate && onNavigate('journeys')}
        >
          See the path women like you actually took →
        </button>
      </div>

    </div>
  );
}
