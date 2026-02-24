import React from 'react';
import { timelineForDay } from '../../data/dayContent';

export default function TimelineBanner({ day }) {
  const label = timelineForDay(day);
  if (!label) return null;
  return (
    <div className="timeline-banner" style={{ marginTop: -6, marginBottom: 18 }}>
      <div className="timeline-line">{label}</div>
    </div>
  );
}
