import React, { useState } from 'react';
import { useJourneys } from '../../hooks/useJourneys';

const JOURNEY_TYPES = [
  { id: 'egg-freezing',    label: 'Egg Freezing'    },
  { id: 'ivf',             label: 'IVF'             },
  { id: 'embryo-banking',  label: 'Embryo Banking'  },
];

const IMPORTANCE_COLORS = {
  critical:    { bg: 'var(--terracotta-light)', color: 'var(--terracotta)' },
  recommended: { bg: 'var(--sage-light)',       color: 'var(--sage)'       },
  optional:    { bg: 'var(--mauve-light)',       color: 'var(--plum)'       },
};

const OUTCOME_COLORS = {
  positive: 'var(--sage)',
  negative: 'var(--terracotta)',
  mixed:    'var(--mauve)',
  neutral:  'var(--text-light)',
};

function ImportanceBadge({ importance }) {
  const style = IMPORTANCE_COLORS[importance] || IMPORTANCE_COLORS.optional;
  return (
    <span className="journey-importance-badge" style={{ background: style.bg, color: style.color }}>
      {importance}
    </span>
  );
}

function FrequencyBar({ frequency }) {
  return (
    <div className="journey-freq-bar-wrap" title={`${Math.round(frequency * 100)}% of journeys included this step`}>
      <div className="journey-freq-bar-track">
        <div className="journey-freq-bar-fill" style={{ width: `${frequency * 100}%` }} />
      </div>
      <span className="journey-freq-label">{Math.round(frequency * 100)}%</span>
    </div>
  );
}

function StepCard({ node, index, isExpanded, onToggle }) {
  return (
    <div className="journey-step-card">
      <button className="journey-step-header" onClick={onToggle}>
        <div className="journey-step-number">{index + 1}</div>
        <div className="journey-step-meta">
          <div className="journey-step-title-row">
            <span className="journey-step-title">{node.title}</span>
            <ImportanceBadge importance={node.importance} />
          </div>
          <FrequencyBar frequency={node.frequency} />
        </div>
        <div className={`journey-step-chevron${isExpanded ? ' open' : ''}`}>›</div>
      </button>

      {isExpanded && (
        <div className="journey-step-body">
          <p className="journey-step-description">{node.description}</p>

          {node.options?.length > 0 && (
            <div className="journey-options-section">
              <div className="journey-options-label">How people navigated this step</div>
              {node.options.map((opt, i) => (
                <div key={i} className="journey-option-row">
                  <div
                    className="journey-option-dot"
                    style={{ borderColor: OUTCOME_COLORS[opt.outcome_signal] || 'var(--text-light)' }}
                  />
                  <div className="journey-option-content">
                    <span className="journey-option-label">{opt.label}</span>
                    {opt.description && (
                      <span className="journey-option-desc">{opt.description}</span>
                    )}
                  </div>
                  <span className="journey-option-freq">
                    {Math.round((opt.frequency || 0) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {node.community_note && (
            <div className="journey-community-note">
              <span className="journey-community-note-icon">💬</span>
              {node.community_note}
            </div>
          )}

          <div className="journey-step-stats">
            <span>Based on {node.source_post_count} community posts</span>
            {node.would_recommend_rate != null && (
              <span>{Math.round(node.would_recommend_rate * 100)}% would recommend</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ComingSoonState({ label }) {
  return (
    <div className="journey-coming-soon">
      <div className="journey-coming-soon-icon">⚙️</div>
      <h3>Coming soon</h3>
      <p>
        We're processing community posts for {label} journeys. Check back soon.
      </p>
    </div>
  );
}

export default function JourneysTab() {
  const [activeType, setActiveType] = useState('egg-freezing');
  const [expandedStep, setExpandedStep] = useState(0);
  const { nodes, loading } = useJourneys(activeType);

  const activeLabel = JOURNEY_TYPES.find(t => t.id === activeType)?.label;

  return (
    <div className="tab-content">
      <div className="journeys-header">
        <h1><em>Journeys</em></h1>
        <p>
          Common paths people take — parsed from real community posts, classified
          into steps, with the options people actually chose at each one.
        </p>
      </div>

      <div className="view-toggle" style={{ marginBottom: 28 }}>
        {JOURNEY_TYPES.map(t => (
          <button
            key={t.id}
            className={`view-toggle-btn${activeType === t.id ? ' active' : ''}`}
            onClick={() => { setActiveType(t.id); setExpandedStep(0); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Loading...</p>
      )}

      {!loading && nodes?.length > 0 && (
        <div className="journey-steps-list">
          {nodes.map((node, i) => (
            <StepCard
              key={node.node_id ?? i}
              node={node}
              index={i}
              isExpanded={expandedStep === i}
              onToggle={() => setExpandedStep(expandedStep === i ? null : i)}
            />
          ))}
        </div>
      )}

      {!loading && (!nodes || nodes.length === 0) && (
        <ComingSoonState label={activeLabel} />
      )}
    </div>
  );
}
