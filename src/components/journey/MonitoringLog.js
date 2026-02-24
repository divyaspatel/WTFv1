import React from 'react';

const METRICS = [
  { key: 'follicles', label: 'Follicle count'           },
  { key: 'e2',        label: 'Estradiol (E2) pg/mL'     },
  { key: 'lh',        label: 'LH (optional)'            },
  { key: 'p4',        label: 'Progesterone (optional)'  },
];

const DAYS_SHOWN = 4;

function loadPastLog(day) {
  try { return JSON.parse(localStorage.getItem(`wtf_log_day_${day}`) || 'null') || {}; }
  catch { return {}; }
}

export default function MonitoringLog({ selectedDay, monitoringInputs, onMonitoringChange, images, onImages }) {
  const startDay = Math.max(1, selectedDay - DAYS_SHOWN + 1);
  const dayColumns = [];
  for (let d = startDay; d <= selectedDay; d++) dayColumns.push(d);

  function handleFiles(e) {
    onImages(Array.from(e.target.files || []).slice(0, 12));
  }

  return (
    <>
      <div className="med-spreadsheet-wrap" style={{ marginTop: 12 }}>
        <table className="med-spreadsheet">
          <thead>
            <tr>
              <th className="med-name-header">Monitoring</th>
              {dayColumns.map(d => (
                <th key={d} className={d === selectedDay ? 'today-header' : ''}>
                  Day {d}{d === selectedDay ? ' (today)' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map(({ key, label }) => (
              <tr key={key}>
                <td className="med-label-cell">{label}</td>
                {dayColumns.map(d => {
                  if (d === selectedDay) {
                    return (
                      <td key={d} className="today-cell">
                        <input
                          className="cell-input"
                          type="text"
                          placeholder="—"
                          value={monitoringInputs[key] || ''}
                          onChange={e => onMonitoringChange(key, e.target.value)}
                        />
                      </td>
                    );
                  }
                  const past = loadPastLog(d);
                  return (
                    <td key={d}>{past.monitoring?.[key] || '—'}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 14 }}>
        <label className="upload-label">Upload ultrasound images (optional)</label>
        <input type="file" accept="image/*" multiple onChange={handleFiles} />
        {images.length > 0 && (
          <div className="image-previews">
            {images.map((file, i) => (
              <img key={i} src={URL.createObjectURL(file)} alt={file.name} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
