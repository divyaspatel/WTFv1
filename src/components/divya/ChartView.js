import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DIVYA_DATA } from '../../data/divyaData';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const CHART_TYPES = [
  { id: 'follicles', label: 'Follicle Growth' },
  { id: 'e2',        label: 'E2 Level'         },
];

function follicleDatasets() {
  return [
    {
      label: 'Avg Largest Follicle (mm)',
      data: DIVYA_DATA.avgLargest,
      borderColor: '#7B4F6E',
      backgroundColor: 'rgba(123,79,110,0.08)',
      borderWidth: 2.5,
      pointBackgroundColor: '#7B4F6E',
      pointRadius: 5,
      tension: 0.35,
      fill: true,
      spanGaps: true,
    },
    {
      label: 'RT Ovary Largest (mm)',
      data: DIVYA_DATA.rtLargest,
      borderColor: '#C9A0A0',
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointBackgroundColor: '#C9A0A0',
      pointRadius: 4,
      tension: 0.35,
      borderDash: [4, 3],
      spanGaps: true,
    },
    {
      label: 'LT Ovary Largest (mm)',
      data: DIVYA_DATA.ltLargest,
      borderColor: '#8FAF8F',
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointBackgroundColor: '#8FAF8F',
      pointRadius: 4,
      tension: 0.35,
      borderDash: [4, 3],
      spanGaps: true,
    },
    {
      label: 'Endometrial Lining (mm)',
      data: DIVYA_DATA.lining,
      borderColor: '#C4714A',
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointBackgroundColor: '#C4714A',
      pointRadius: 4,
      tension: 0.35,
    },
  ];
}

function e2Datasets() {
  return [
    {
      label: 'E2 (Estradiol) pg/mL',
      data: DIVYA_DATA.e2,
      borderColor: '#7B4F6E',
      backgroundColor: 'rgba(123,79,110,0.08)',
      borderWidth: 2.5,
      pointBackgroundColor: '#7B4F6E',
      pointRadius: 5,
      tension: 0.35,
      fill: true,
    },
  ];
}

export default function ChartView() {
  const [chartType, setChartType] = useState('follicles');
  const isE2 = chartType === 'e2';

  const data = {
    labels: DIVYA_DATA.labels,
    datasets: isE2 ? e2Datasets() : follicleDatasets(),
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { family: 'Nunito', size: 12 },
          color: '#6B5363',
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: ctx =>
            ` ${ctx.dataset.label}: ${ctx.parsed.y !== null ? ctx.parsed.y + (isE2 ? ' pg/mL' : ' mm') : '—'}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: '#F5ECEC' },
        ticks: { font: { family: 'Nunito', size: 11 }, color: '#9E8A96' },
      },
      y: {
        grid: { color: '#F5ECEC' },
        ticks: {
          font: { family: 'Nunito', size: 11 },
          color: '#9E8A96',
          callback: v => v + (isE2 ? '' : ' mm'),
        },
        title: {
          display: true,
          text: isE2 ? 'E2 pg/mL' : 'Size (mm)',
          font: { family: 'Nunito', size: 11 },
          color: '#9E8A96',
        },
      },
    },
  };

  return (
    <div id="divya-chart-wrap">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {CHART_TYPES.map(ct => (
          <button
            key={ct.id}
            className={`follicle-day-btn${chartType === ct.id ? ' active' : ''}`}
            onClick={() => setChartType(ct.id)}
          >
            {ct.label}
          </button>
        ))}
      </div>
      <Line data={data} options={options} />
    </div>
  );
}
