import React from 'react';
import { contentForDay } from '../../data/dayContent';

export default function WhatToExpect({ day }) {
  const { expectTitle, expectBody, questions } = contentForDay(day);

  return (
    <>
      <div className="section-top" style={{ marginBottom: 20 }}>
        <div className="section-label">What to Expect</div>
        <h2 style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 20, color: 'var(--text-dark)', marginBottom: 10 }}>
          {expectTitle}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.6, fontWeight: 300 }}>
          {expectBody}
        </p>
      </div>

      <div className="divider" />

      <div className="questions-section" style={{ marginBottom: 24 }}>
        <h3>Questions to ask your doctor or nurse today</h3>
        <ul className="question-list">
          {questions.map((q, i) => <li key={i}>{q}</li>)}
        </ul>
      </div>
    </>
  );
}
