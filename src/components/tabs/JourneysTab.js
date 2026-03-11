import React, { useState } from 'react';

// Placeholder structure — to be replaced by model output
// Each journey has steps; each step has options people chose
const PLACEHOLDER_JOURNEYS = [
  {
    id: 'egg-freezing',
    label: 'Egg Freezing',
    steps: [
      {
        id: 1,
        title: 'Getting Started',
        description: 'How people decided to pursue egg freezing and found a clinic',
        options: [
          { label: 'Self-referred after personal research' },
          { label: 'OB/GYN or PCP referral' },
          { label: 'Prompted by life event or diagnosis' },
        ],
      },
      {
        id: 2,
        title: 'Choosing a Clinic',
        description: 'How people evaluated and selected a reproductive endocrinologist',
        options: [
          { label: 'Chose based on insurance coverage' },
          { label: 'Prioritized success rates / lab quality' },
          { label: 'Went with proximity or wait times' },
        ],
      },
      {
        id: 3,
        title: 'Baseline Testing',
        description: 'Initial bloodwork and ultrasound to assess ovarian reserve',
        options: [
          { label: 'AMH in typical range — proceeded directly' },
          { label: 'Low AMH — adjusted protocol or sought 2nd opinion' },
          { label: 'High AMH — monitored for OHSS risk' },
        ],
      },
      {
        id: 4,
        title: 'Stimulation Protocol',
        description: 'The medication protocol chosen by the care team',
        options: [
          { label: 'Antagonist protocol (most common)' },
          { label: 'Lupron/agonist protocol' },
          { label: 'Mini-stim / low-dose protocol' },
        ],
      },
      {
        id: 5,
        title: 'Monitoring & Adjustments',
        description: 'What happened during the stimulation phase',
        options: [
          { label: 'Smooth response — minimal adjustments' },
          { label: 'Slow response — dose increased or cycle extended' },
          { label: 'Over-response — dose reduced or trigger delayed' },
        ],
      },
      {
        id: 6,
        title: 'Retrieval Outcome',
        description: 'How the egg retrieval went and how people felt about results',
        options: [
          { label: 'Met or exceeded expectations' },
          { label: 'Fewer eggs than hoped — considering another cycle' },
          { label: 'Decided to do an additional cycle' },
        ],
      },
    ],
  },
  {
    id: 'ivf',
    label: 'IVF',
    steps: [],
  },
  {
    id: 'embryo-banking',
    label: 'Embryo Banking',
    steps: [],
  },
];

function StepCard({ step, index, isExpanded, onToggle }) {
  return (
    <div className="journey-step-card">
      <button className="journey-step-header" onClick={onToggle}>
        <div className="journey-step-number">{index + 1}</div>
        <div className="journey-step-meta">
          <div className="journey-step-title">{step.title}</div>
          <div className="journey-step-desc">{step.description}</div>
        </div>
        <div className={`journey-step-chevron${isExpanded ? ' open' : ''}`}>›</div>
      </button>

      {isExpanded && (
        <div className="journey-step-options">
          {step.options.map((opt, i) => (
            <div key={i} className="journey-option-row">
              <div className="journey-option-dot" />
              <span className="journey-option-label">{opt.label}</span>
              <span className="journey-option-badge">coming soon</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ComingSoonBanner() {
  return (
    <div className="journey-coming-soon">
      <div className="journey-coming-soon-icon">⚙️</div>
      <h3>Model in progress</h3>
      <p>
        We're building a classifier that reads Reddit posts, identifies journey stages,
        and extracts how different people navigated each step. The structure above is
        the target output — real community paths are coming soon.
      </p>
    </div>
  );
}

export default function JourneysTab() {
  const [activeJourney, setActiveJourney] = useState('egg-freezing');
  const [expandedStep, setExpandedStep] = useState(0);

  const journey = PLACEHOLDER_JOURNEYS.find(j => j.id === activeJourney);

  return (
    <div className="tab-content">
      <div className="journeys-header">
        <h1><em>Journeys</em></h1>
        <p>
          Common paths people take — parsed from thousands of real community posts,
          classified into steps, with the options people actually chose at each one.
        </p>
      </div>

      {/* Journey type selector */}
      <div className="view-toggle" style={{ marginBottom: 28 }}>
        {PLACEHOLDER_JOURNEYS.map(j => (
          <button
            key={j.id}
            className={`view-toggle-btn${activeJourney === j.id ? ' active' : ''}`}
            onClick={() => { setActiveJourney(j.id); setExpandedStep(0); }}
          >
            {j.label}
          </button>
        ))}
      </div>

      {journey.steps.length > 0 ? (
        <>
          <div className="journey-steps-list">
            {journey.steps.map((step, i) => (
              <StepCard
                key={step.id}
                step={step}
                index={i}
                isExpanded={expandedStep === i}
                onToggle={() => setExpandedStep(expandedStep === i ? null : i)}
              />
            ))}
          </div>
          <ComingSoonBanner />
        </>
      ) : (
        <ComingSoonBanner />
      )}
    </div>
  );
}
