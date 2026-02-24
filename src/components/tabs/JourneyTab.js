import React, { useState, useEffect } from 'react';
import { useProtocol } from '../../hooks/useProtocol';
import DayNav from '../journey/DayNav';
import TimelineBanner from '../journey/TimelineBanner';
import WhatToExpect from '../journey/WhatToExpect';
import ProtocolSetup from '../journey/ProtocolSetup';
import MedSpreadsheet from '../journey/MedSpreadsheet';
import MonitoringLog from '../journey/MonitoringLog';
import MoodSelector from '../journey/MoodSelector';

const LOG_KEY = day => `wtf_log_day_${day}`;

function loadDayLog(day) {
  try { return JSON.parse(localStorage.getItem(LOG_KEY(day)) || 'null') || {}; }
  catch { return {}; }
}

export default function JourneyTab() {
  const { protocol, saveProtocol } = useProtocol();
  const [showProtocol, setShowProtocol] = useState(protocol.length === 0);
  const [selectedDay, setSelectedDay] = useState(1);
  const [feel, setFeel] = useState(null);
  const [notes, setNotes] = useState('');
  const [hadUltrasound, setHadUltrasound] = useState(false);
  const [medInputs, setMedInputs] = useState({});
  const [monitoringInputs, setMonitoringInputs] = useState({});
  const [images, setImages] = useState([]);
  const [toast, setToast] = useState(false);

  // Load saved data when day changes
  useEffect(() => {
    const saved = loadDayLog(selectedDay);
    setFeel(saved.feel || null);
    setNotes(saved.notes || '');
    setMedInputs(saved.meds || {});
    setMonitoringInputs(saved.monitoring || {});
    setHadUltrasound(false);
    setImages([]);
  }, [selectedDay]);

  function handleProtocolSave(meds) {
    saveProtocol(meds);
    setShowProtocol(false);
    showToast();
  }

  function handleMedChange(medName, field, value) {
    setMedInputs(prev => ({
      ...prev,
      [medName]: { ...prev[medName], [field]: value },
    }));
  }

  function handleMonitoringChange(key, value) {
    setMonitoringInputs(prev => ({ ...prev, [key]: value }));
  }

  function handleSaveEntry() {
    const log = {
      feel,
      notes,
      meds: medInputs,
      monitoring: hadUltrasound ? monitoringInputs : {},
    };
    localStorage.setItem(LOG_KEY(selectedDay), JSON.stringify(log));
    showToast();
  }

  function showToast() {
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  }

  const dayLabel = selectedDay === 7 ? 'Day 7+' : `Day ${selectedDay}`;

  return (
    <div className="tab-content">
      {/* Chat intro */}
      <div className="chat-intro" style={{ marginBottom: 20 }}>
        <div className="chat-date-divider">Your Journey</div>
        <div className="chat-bubble-row from-divya" style={{ marginBottom: 0 }}>
          <div className="chat-avatar-small">💬</div>
          <div className="chat-bubble her" style={{ fontSize: 13.5 }}>
            Track your cycle day by day — medications, monitoring results, how you're feeling. This is your space. 🌸
          </div>
        </div>
      </div>

      {/* Day header */}
      <div className="day-header">
        <h1>{dayLabel} of Stimulation</h1>
        <p>Egg Freezing Cycle #1</p>
      </div>

      {/* Day nav */}
      <DayNav selectedDay={selectedDay} onSelect={setSelectedDay} />

      {/* Timeline banner */}
      <TimelineBanner day={selectedDay} />

      {/* What to expect + questions */}
      <WhatToExpect day={selectedDay} />

      {/* Protocol setup (shown when no protocol saved, or editing) */}
      {showProtocol && (
        <ProtocolSetup onSave={handleProtocolSave} />
      )}

      {/* Daily log (shown when protocol exists) */}
      {!showProtocol && protocol.length > 0 && (
        <div className="section-bottom" id="daily-log">
          <div className="section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Track Your Day</span>
            <span className="edit-protocol-link" onClick={() => setShowProtocol(true)}>Edit medications</span>
          </div>
          <h2>Daily Medication Tracking</h2>

          <MedSpreadsheet
            protocol={protocol}
            selectedDay={selectedDay}
            medInputs={medInputs}
            onMedChange={handleMedChange}
          />

          {/* Ultrasound & Bloodwork */}
          <div className="section-subcard" style={{ marginTop: 14 }}>
            <div className="subcard-header">
              <div className="subcard-title">Ultrasound &amp; Bloodwork</div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={hadUltrasound}
                  onChange={e => setHadUltrasound(e.target.checked)}
                />
                <span>Had ultrasound &amp; bloodwork today</span>
              </label>
            </div>
            {hadUltrasound && (
              <MonitoringLog
                selectedDay={selectedDay}
                monitoringInputs={monitoringInputs}
                onMonitoringChange={handleMonitoringChange}
                images={images}
                onImages={setImages}
              />
            )}
          </div>

          {/* Mood + Notes */}
          <div className="journal-grid" style={{ marginTop: 14 }}>
            <div className="journal-field">
              <label>Overall mood</label>
              <MoodSelector selected={feel} onSelect={setFeel} />
              <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-light)' }}>
                Tip: choose <strong>No change</strong> if nothing shifted today.
              </div>
            </div>
            <div className="journal-field full">
              <label>Notes for today</label>
              <textarea
                rows={4}
                placeholder="How are you really feeling? Any symptoms, wins, worries, or questions for tomorrow's appointment..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <button className="btn-save" onClick={handleSaveEntry}>Save today's entry ✓</button>
        </div>
      )}

      {/* Toast */}
      <div className={`toast${toast ? ' show' : ''}`}>Today's entry saved!</div>
    </div>
  );
}
