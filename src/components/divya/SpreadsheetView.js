import React, { useState } from 'react';

const SHEETS = ['Medications', 'Hormones & Labs', 'Follicle Data', 'Symptoms & Notes'];
const SHEET_IDS = ['meds', 'hormones', 'follicles', 'symptoms'];

const DAY_HEADERS = [
  { day: 'D1',  date: 'Mar 4'  },
  { day: 'D2',  date: 'Mar 5'  },
  { day: 'D3',  date: 'Mar 6'  },
  { day: 'D4',  date: 'Mar 7'  },
  { day: 'D5',  date: 'Mar 8'  },
  { day: 'D6',  date: 'Mar 9'  },
  { day: 'D7',  date: 'Mar 10' },
  { day: 'D8',  date: 'Mar 11' },
  { day: 'D9',  date: 'Mar 12' },
  { day: 'D10', date: 'Mar 13' },
  { day: 'D11', date: 'Mar 14' },
];

function Th({ children }) {
  return (
    <th>
      {children.day}<br />
      <span style={{ fontWeight: 300, textTransform: 'none', letterSpacing: 0 }}>{children.date}</span>
    </th>
  );
}

function MedsSheet() {
  return (
    <div className="journey-table-wrap">
      <table className="journey-table">
        <thead>
          <tr>
            <th className="jt-label">Medication</th>
            {DAY_HEADERS.map(h => <Th key={h.day}>{h}</Th>)}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="jt-label">Gonal-F</td>
            <td>200 IU</td><td>200 IU</td><td>150 IU</td><td>150 IU</td><td>150 IU</td><td>150 IU</td><td>225 IU</td><td>225 IU</td><td>225 IU</td>
            <td className="jt-trigger">Trigger shot ⚡<br /><small>40U + 1.2mL hCG</small></td>
            <td className="jt-surgery">Surgery Day</td>
          </tr>
          <tr>
            <td className="jt-label">Menopur</td>
            <td>—</td><td>—</td><td>1 vial</td><td>1 vial</td><td>2 vials</td><td>2 vials</td><td>2 vials</td><td>2 vials</td><td>2 vials</td><td>3 vials</td><td>—</td>
          </tr>
          <tr>
            <td className="jt-label">Cetrotide</td>
            <td>—</td><td>—</td><td>—</td><td>—</td><td>250 mcg</td><td>250 mcg</td><td>250 mcg</td><td>250 mcg</td><td>250 mcg</td><td>250 mcg</td><td>—</td>
          </tr>
          <tr className="jt-section-row"><td colSpan={12}>Monitoring</td></tr>
          <tr>
            <td className="jt-label">Ultrasound &amp; bloodwork?</td>
            <td>✅</td><td>—</td><td>✅</td><td>—</td><td>✅</td><td>—</td><td>✅</td><td>—</td><td>✅</td><td>✅</td><td>✅</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function HormonesSheet() {
  return (
    <div className="journey-table-wrap">
      <table className="journey-table">
        <thead>
          <tr>
            <th className="jt-label">Lab Value</th>
            <th>D1 Mar 4</th><th>D3 Mar 6</th><th>D5 Mar 8</th><th>D7 Mar 10</th>
            <th>D9 Mar 12</th><th>D10 Mar 13</th><th>D11 Mar 14</th><th>D14 Mar 17</th>
          </tr>
        </thead>
        <tbody>
          <tr className="jt-section-row"><td colSpan={9}>Estradiol (E2) pg/mL</td></tr>
          <tr>
            <td className="jt-label">E2 Level</td>
            <td>31</td><td>82.84</td><td>328.6</td><td>673.2</td><td>1,464</td><td>1,992</td><td>2,988</td><td>2,851</td>
          </tr>
          <tr>
            <td className="jt-label">E2 Expected Range</td>
            <td className="jt-range">25–75</td><td className="jt-range">100–200</td>
            <td className="jt-range">400–800</td><td className="jt-range">1000–1600</td>
            <td className="jt-range">1600–2400</td><td className="jt-range">2000–3000</td>
            <td className="jt-range">2000–3000</td><td>—</td>
          </tr>
          <tr className="jt-section-row"><td colSpan={9}>Other Labs</td></tr>
          <tr><td className="jt-label">FSH</td><td>6.78</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
          <tr><td className="jt-label">LH</td><td>5.24</td><td>—</td><td>—</td><td>—</td><td>—</td><td>43.43</td><td>—</td><td>—</td></tr>
          <tr><td className="jt-label">P4 (Progesterone)</td><td>0.4</td><td>0.3</td><td>0.4</td><td>0.9</td><td>0.9</td><td>1.2</td><td>1.5</td><td>—</td></tr>
          <tr><td className="jt-label">Beta HCG</td><td>&lt;0.100</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>72.23</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function FolliclesSheet() {
  return (
    <div className="journey-table-wrap">
      <table className="journey-table">
        <thead>
          <tr>
            <th className="jt-label">Metric</th>
            <th>D1 Mar 4</th><th>D3 Mar 6</th><th>D5 Mar 8</th>
            <th>D7 Mar 10</th><th>D9 Mar 12</th><th>D10 Mar 13</th>
          </tr>
        </thead>
        <tbody>
          <tr className="jt-section-row"><td colSpan={7}>Uterine Lining</td></tr>
          <tr><td className="jt-label">Lining thickness</td><td>3.28 mm</td><td>5.14 mm</td><td>5.48 mm</td><td>8.47 mm</td><td>8.72 mm</td><td>9.07 mm</td></tr>
          <tr><td className="jt-label">Lining quality</td><td>Good</td><td>Good</td><td>Good</td><td>Good</td><td>Good</td><td>Good</td></tr>
          <tr className="jt-section-row"><td colSpan={7}>Right Ovary</td></tr>
          <tr>
            <td className="jt-label">RT follicles (mm)</td>
            <td>28.67, 15.62</td><td>—</td><td>9.60, 9.10, 8.69</td>
            <td>11.95, 11.93, 11.30, 8.95</td>
            <td>13.85, 13.82, 13.78, 12.24, 11.61, 11.14, 10.47, 10.27</td>
            <td>19.84, 19.71, 19.36, 19.11, 18.13, 16.23, 15.72</td>
          </tr>
          <tr><td className="jt-label">RT count</td><td>2</td><td>—</td><td>3</td><td>4</td><td>8</td><td>7</td></tr>
          <tr className="jt-section-row"><td colSpan={7}>Left Ovary</td></tr>
          <tr>
            <td className="jt-label">LT follicles (mm)</td>
            <td>28.27, 13.54</td><td>9.07</td><td>12.60, 11.39</td>
            <td>16.41, 15.69, 14.98, 11.64</td>
            <td>18.37, 18.10, 16.61, 13.62, 12.16, 10.64</td>
            <td>20.58, 18.23, 18.01, 17.75, 16.84, 15.98, 15.72</td>
          </tr>
          <tr><td className="jt-label">LT count</td><td>2</td><td>1</td><td>2</td><td>4</td><td>6</td><td>7</td></tr>
          <tr className="jt-section-row"><td colSpan={7}>Summary</td></tr>
          <tr><td className="jt-label">Total follicles</td><td>4 (13R, 12L at baseline AFC)</td><td>1</td><td>5</td><td>8</td><td>14</td><td>14</td></tr>
          <tr><td className="jt-label">Avg largest (mm)</td><td>21.5</td><td>9.1</td><td>11.0</td><td>14.2</td><td>16.1</td><td>19.4</td></tr>
          <tr>
            <td className="jt-label">Notes</td>
            <td>AFC: 13R, 12L</td><td>—</td><td>—</td>
            <td>LT growing faster; LT biggest 15mm, RT biggest 11mm</td>
            <td>RT catching up; LT has 2 follicles &gt;18mm</td>
            <td>Both sides mature</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SymptomsSheet() {
  return (
    <div className="journey-table-wrap">
      <table className="journey-table">
        <thead>
          <tr>
            <th className="jt-label">Day</th>
            <th style={{ minWidth: 260, textAlign: 'left' }}>Symptoms &amp; Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr><td className="jt-label">Day 2 · Mar 5</td><td style={{ textAlign: 'left' }}>Sleepy</td></tr>
          <tr><td className="jt-label">Day 3 · Mar 6</td><td style={{ textAlign: 'left' }}>Sleepy, feeling a little bloated</td></tr>
          <tr><td className="jt-label">Day 5 · Mar 8</td><td style={{ textAlign: 'left' }}>Morning — sleepy, emotional (crying from gratitude). Sensitive after 6pm with lots of work and appointments to catch up on</td></tr>
          <tr><td className="jt-label">Day 6 · Mar 9</td><td style={{ textAlign: 'left' }}>Tired. Felt a little cramping (realized hadn't had water all day until 6pm)</td></tr>
          <tr><td className="jt-label">Day 7 · Mar 10</td><td style={{ textAlign: 'left' }}>Really gassy waking up. Feeling a little bloated in the morning, more full in the stomach area in the afternoon</td></tr>
          <tr><td className="jt-label">Day 8 · Mar 11</td><td style={{ textAlign: 'left' }}>Feeling fuller in the stomach area. SO sleepy in the mornings</td></tr>
          <tr><td className="jt-label">Day 9 · Mar 12</td><td style={{ textAlign: 'left' }}>Feeling bloated and tired. Cried after the last shot — feeling very emotional</td></tr>
          <tr><td className="jt-label">Day 10 · Mar 13</td><td style={{ textAlign: 'left' }}>Tired, sleepy, headache. Exhausted in the afternoon (lack of sleep). Feeling better in the evening after a walk in the sun</td></tr>
          <tr>
            <td className="jt-label" style={{ background: '#FFF5F0' }}>Day 11 · Mar 14 — Trigger</td>
            <td style={{ textAlign: 'left', background: '#FFF5F0' }}>Trigger shot day! Gonal-F 40U + 1.2mL of 5K hCG. Diarrhea in the morning. Feeling much more energetic</td>
          </tr>
          <tr>
            <td className="jt-label jt-surgery">Day 12 · Mar 15 — Surgery</td>
            <td style={{ textAlign: 'left', background: '#F5ECEC' }}>So sleepy, slept on and off all day</td>
          </tr>
          <tr><td className="jt-label">Day 13 · Mar 16</td><td style={{ textAlign: 'left' }}>Bleeding/spotting. Took Tylenol and was able to be up and about all day</td></tr>
        </tbody>
      </table>
    </div>
  );
}

export default function SpreadsheetView() {
  const [activeSheet, setActiveSheet] = useState('meds');

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {SHEET_IDS.map((id, i) => (
          <button
            key={id}
            className={`follicle-day-btn${activeSheet === id ? ' active' : ''}`}
            onClick={() => setActiveSheet(id)}
          >
            {SHEETS[i]}
          </button>
        ))}
      </div>
      {activeSheet === 'meds'      && <MedsSheet />}
      {activeSheet === 'hormones'  && <HormonesSheet />}
      {activeSheet === 'follicles' && <FolliclesSheet />}
      {activeSheet === 'symptoms'  && <SymptomsSheet />}
    </div>
  );
}
