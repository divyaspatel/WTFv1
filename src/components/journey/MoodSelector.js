import React from 'react';
import { FEELS } from '../../data/feels';

export default function MoodSelector({ selected, onSelect }) {
  const noChangeSelected = selected === 'No change';

  return (
    <div className="feel-selector">
      {FEELS.map(label => (
        <button
          key={label}
          type="button"
          className={`feel-btn${selected === label ? ' selected' : ''}`}
          disabled={noChangeSelected && label !== 'No change'}
          onClick={() => onSelect(selected === label ? null : label)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
