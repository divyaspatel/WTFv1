import React, { useState } from 'react';
import { useProtocol } from '../../hooks/useProtocol';
import { useJourneyDay } from '../../hooks/useJourneyDay';
import DayNav from '../journey/DayNav';
import TimelineBanner from '../journey/TimelineBanner';
import WhatToExpect from '../journey/WhatToExpect';
import ProtocolSetup from '../journey/ProtocolSetup';
import MedSpreadsheet from '../journey/MedSpreadsheet';
import MonitoringLog from '../journey/MonitoringLog';
import MoodSelector from '../journey/MoodSelector';
import Toast from '../Toast';

export default function JourneyTab() {
  const { protocol, saveProtocol } = useProtocol();
  const [showProtocol, setShowProtocol] = useState(protocol.length === 0);
  const [selectedDay, setSelectedDay] = useState(1);
  const [hadUltrasound, setHadUltrasound] = useState(false);
  const [images, setImages] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '' });

  const {
    feel, setFeel,
    notes, setNotes,
    medInputs, setMedInputs,
    monitoringInputs, setMonitoringInputs,
    saveDay,
  } = useJourneyDay(selectedDay);

  function handleDayChange(day) {
    setSelectedDay(day);
    setHadUltrasound(false);
    setImages([]);
  }

  async function handleProtocolSave(meds) {
    await saveProtocol(meds);
    setShowProtocol(false);
    showToast('Protocol saved!');
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

  async function handleSaveEntry() {
    try {
      await saveDay({ feel, notes, medInputs, monitoringInputs, hadUltrasound, protocol });
      showToast("Today's entry saved!");
    } catch (err) {
      console.error('Save failed:', err);
      showToast('Save failed: ' + err.message);
    }
  }

  function showToast(message) {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 2500);
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
      <DayNav selectedDay={selectedDay} onSelect={handleDayChange} />

      {/* Timeline banner */}
      <TimelineBanner day={selectedDay} />

      {/* What to expect + questions */}
      <WhatToExpect day={selectedDay} />

      {/* Protocol setup */}
      {showProtocol && (
        <ProtocolSetup onSave={handleProtocolSave} />
      )}

      {/* Daily log */}
      {!showProtocol && protocol.length > 0 && (
        <div className="section-bottom">
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

      <Toast show={toast.show} message={toast.message} />
    </div>
  );
}
