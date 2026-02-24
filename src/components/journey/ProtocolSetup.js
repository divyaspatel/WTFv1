import React, { useState } from 'react';
import { MED_CATEGORIES } from '../../data/medCategories';

export default function ProtocolSetup({ onSave }) {
  const [checked, setChecked] = useState({});

  function toggle(name) {
    setChecked(prev => ({ ...prev, [name]: !prev[name] }));
  }

  function handleSave() {
    const selected = Object.entries(checked)
      .filter(([, v]) => v)
      .map(([name]) => {
        const category = Object.entries(MED_CATEGORIES).find(([, meds]) => meds.includes(name))?.[0] || '';
        return { name, category };
      });
    if (selected.length === 0) {
      alert('Please select at least one medication.');
      return;
    }
    onSave(selected);
  }

  return (
    <div className="protocol-setup">
      <div className="section-label">Your Medication Protocol</div>
      <h2 className="section-top-h2">Set up your protocol</h2>
      <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 24, fontWeight: 300 }}>
        Select all medications you've been prescribed. You can update this anytime.
      </p>

      {Object.entries(MED_CATEGORIES).map(([category, meds]) => (
        <div className="protocol-category" key={category}>
          <h4>{category} Medications</h4>
          <div className="med-checkboxes">
            {meds.map(med => {
              const id = `med-${med.replace(/\s+/g, '-').toLowerCase()}`;
              return (
                <React.Fragment key={med}>
                  <input
                    type="checkbox"
                    className="med-checkbox"
                    id={id}
                    checked={!!checked[med]}
                    onChange={() => toggle(med)}
                  />
                  <label className="med-label" htmlFor={id}>{med}</label>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ))}

      <div className="protocol-actions">
        <button className="btn-save-protocol" onClick={handleSave}>Save my protocol →</button>
      </div>
    </div>
  );
}
