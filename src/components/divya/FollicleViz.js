import React, { useEffect, useRef, useState } from 'react';
import { DIVYA_DATA } from '../../data/divyaData';

function follicleColor(mm) {
  if (mm >= 18) return '#C4714A';
  if (mm >= 15) return '#7B4F6E';
  if (mm >= 10) return '#8FAF8F';
  return '#C9A0A0';
}

const POSITIONS = [
  [100, 100],
  [65,  75], [135,  75],
  [65, 130], [135, 130],
  [100, 55], [100, 145],
  [45, 100], [155, 100],
];

function drawOvary(canvas, follicles) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Ovary outline
  ctx.beginPath();
  ctx.ellipse(W / 2, H / 2, W / 2 - 8, H / 2 - 8, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#E8D0D0';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#FAF7F2';
  ctx.fill();

  if (follicles.length === 0) {
    ctx.font = '11px Nunito';
    ctx.fillStyle = '#9E8A96';
    ctx.textAlign = 'center';
    ctx.fillText('No data', W / 2, H / 2 + 4);
    return;
  }

  const maxMm = 28, maxR = 28, minR = 6;
  const sorted = [...follicles].sort((a, b) => b - a).slice(0, 9);

  sorted.forEach((mm, i) => {
    const r = Math.max(minR, Math.round(minR + (mm / maxMm) * (maxR - minR)));
    const [px, py] = POSITIONS[i] || [W / 2, H / 2];

    const gradient = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, r * 0.1, px, py, r);
    gradient.addColorStop(0, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(1, follicleColor(mm) + 'CC');

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = follicleColor(mm);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (r >= 10) {
      ctx.font = `bold ${Math.max(8, Math.round(r / 2))}px Nunito`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(mm.toFixed(0), px, py);
    }
  });
}

export default function FollicleViz() {
  const [activeDay, setActiveDay] = useState(5);
  const rtRef = useRef(null);
  const ltRef = useRef(null);

  useEffect(() => {
    const dayData = DIVYA_DATA.folliclesByDay[activeDay];
    drawOvary(rtRef.current, dayData.rt);
    drawOvary(ltRef.current, dayData.lt);
  }, [activeDay]);

  return (
    <div className="follicle-section">
      <h3>Follicle Growth Over Time</h3>
      <p>Each circle represents a measured follicle — sized proportionally to its diameter in mm. Select a day to compare.</p>

      <div className="follicle-day-nav">
        {Object.entries(DIVYA_DATA.folliclesByDay).map(([idx, d]) => (
          <button
            key={idx}
            className={`follicle-day-btn${parseInt(idx) === activeDay ? ' active' : ''}`}
            onClick={() => setActiveDay(parseInt(idx))}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="follicle-canvas-wrap">
        <div className="follicle-ovary">
          <h4>Right Ovary</h4>
          <canvas ref={rtRef} width={200} height={200} />
        </div>
        <div className="follicle-ovary">
          <h4>Left Ovary</h4>
          <canvas ref={ltRef} width={200} height={200} />
        </div>
      </div>

      <div className="follicle-legend">
        <span><span className="legend-dot" style={{ background: '#C9A0A0' }} /> &lt;10mm (antral)</span>
        <span><span className="legend-dot" style={{ background: '#8FAF8F' }} /> 10–14mm (growing)</span>
        <span><span className="legend-dot" style={{ background: '#7B4F6E' }} /> 15–17mm (maturing)</span>
        <span><span className="legend-dot" style={{ background: '#C4714A' }} /> 18mm+ (mature)</span>
      </div>
    </div>
  );
}
