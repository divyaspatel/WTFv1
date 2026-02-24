import React from 'react';

const DAYS = [1, 2, 3, 4, 5, 6, 7];

export default function DayNav({ selectedDay, onSelect }) {
  function prev() { if (selectedDay > 1) onSelect(selectedDay - 1); }
  function next() { if (selectedDay < 7) onSelect(selectedDay + 1); }

  return (
    <div className="day-nav">
      <button className="day-nav-btn" onClick={prev} disabled={selectedDay === 1}>←</button>
      <div className="day-pills">
        {DAYS.map(d => (
          <div
            key={d}
            className={`day-pill${selectedDay === d ? ' active' : ''}`}
            onClick={() => onSelect(d)}
          >
            {d === 7 ? 'Day 7+' : `Day ${d}`}
          </div>
        ))}
      </div>
      <button className="day-nav-btn" onClick={next} disabled={selectedDay === 7}>→</button>
    </div>
  );
}
