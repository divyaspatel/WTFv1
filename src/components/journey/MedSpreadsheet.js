import React from 'react';

const DAYS_SHOWN = 4;

function loadPastLog(day) {
  try { return JSON.parse(localStorage.getItem(`wtf_log_day_${day}`) || 'null') || {}; }
  catch { return {}; }
}

export default function MedSpreadsheet({ protocol, selectedDay, medInputs, onMedChange }) {
  const startDay = Math.max(1, selectedDay - DAYS_SHOWN + 1);
  const dayColumns = [];
  for (let d = startDay; d <= selectedDay; d++) dayColumns.push(d);

  // Group protocol meds by category
  const categories = {};
  protocol.forEach(({ name, category }) => {
    if (!categories[category]) categories[category] = [];
    categories[category].push(name);
  });

  if (protocol.length === 0) return null;

  return (
    <div className="med-spreadsheet-wrap">
      <table className="med-spreadsheet">
        <thead>
          <tr>
            <th className="med-name-header">Medication</th>
            {dayColumns.map(d => (
              <th key={d} colSpan={2} className={d === selectedDay ? 'today-header' : ''}>
                Day {d}{d === selectedDay ? ' (today)' : ''}
              </th>
            ))}
          </tr>
          <tr>
            <th className="med-name-header" />
            {dayColumns.map(d => (
              <React.Fragment key={d}>
                <th className={d === selectedDay ? 'today-header' : ''}>Dose</th>
                <th className={d === selectedDay ? 'today-header' : ''}>Time</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(categories).map(([cat, meds]) => (
            <React.Fragment key={cat}>
              <tr className="category-row">
                <td className="med-category-cell">{cat}</td>
                {dayColumns.map(d => (
                  <td key={d} colSpan={2} style={{ background: 'var(--cream)' }} />
                ))}
              </tr>
              {meds.map(med => (
                <tr key={med}>
                  <td className="med-name-cell">{med}</td>
                  {dayColumns.map(d => {
                    if (d === selectedDay) {
                      return (
                        <React.Fragment key={d}>
                          <td className="today-cell">
                            <input
                              className="spreadsheet-input"
                              type="text"
                              placeholder="dose"
                              value={medInputs[med]?.dose || ''}
                              onChange={e => onMedChange(med, 'dose', e.target.value)}
                            />
                          </td>
                          <td className="today-cell">
                            <input
                              className="spreadsheet-input"
                              type="time"
                              value={medInputs[med]?.time || ''}
                              onChange={e => onMedChange(med, 'time', e.target.value)}
                            />
                          </td>
                        </React.Fragment>
                      );
                    }
                    const past = loadPastLog(d);
                    const val = past.meds?.[med];
                    return (
                      <React.Fragment key={d}>
                        <td className="past-cell"><div className="past-value">{val?.dose || '—'}</div></td>
                        <td className="past-cell"><div className="past-value">{val?.time || '—'}</div></td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
