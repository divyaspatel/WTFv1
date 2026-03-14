import React, { useState } from 'react';
import { useJourneys } from '../../hooks/useJourneys';

const JOURNEY_TYPES = [
  { id: 'egg-freezing',    label: 'Egg Freezing'    },
  { id: 'ivf',             label: 'IVF'             },
  { id: 'embryo-banking',  label: 'Embryo Banking'  },
];

const OUTCOME_COLORS = {
  positive: 'var(--sage)',
  negative: 'var(--terracotta)',
  mixed:    'var(--mauve)',
  neutral:  'var(--text-light)',
};

function FrequencyBar({ frequency, color }) {
  return (
    <div className="journey-freq-bar-wrap">
      <div className="journey-freq-bar-track">
        <div
          className="journey-freq-bar-fill"
          style={{ width: `${frequency * 100}%`, background: color || 'var(--terracotta)' }}
        />
      </div>
      <span className="journey-freq-label">{Math.round(frequency * 100)}%</span>
    </div>
  );
}

// ── Choice card — visually prominent, shows the question + options as a real decision ──
function ChoiceCard({ node, index, isExpanded, onToggle }) {
  return (
    <div className="journey-choice-card">
      <button className="journey-choice-header" onClick={onToggle}>
        <div className="journey-choice-badge">Decision</div>
        <div className="journey-choice-meta">
          <div className="journey-choice-question">{node.choice_question}</div>
          <div className="journey-choice-subtitle">
            {Math.round(node.frequency * 100)}% of journeys faced this decision
            {node.decision_point_count > 0 && ` · ${node.decision_point_count} explicit accounts`}
          </div>
        </div>
        <div className={`journey-step-chevron${isExpanded ? ' open' : ''}`}>›</div>
      </button>

      {isExpanded && (
        <div className="journey-choice-body">
          {node.description && (
            <p className="journey-step-description">{node.description}</p>
          )}

          <div className="journey-choice-options-label">What women chose</div>
          <div className="journey-choice-options">
            {node.options?.map((opt, i) => (
              <div key={i} className="journey-choice-option">
                <div className="journey-choice-option-top">
                  <span
                    className="journey-choice-option-label"
                    style={{ color: OUTCOME_COLORS[opt.outcome_signal] || 'var(--text-dark)' }}
                  >
                    {opt.label}
                  </span>
                  <span className="journey-option-freq">{Math.round((opt.frequency || 0) * 100)}%</span>
                </div>
                <FrequencyBar frequency={opt.frequency || 0} color={OUTCOME_COLORS[opt.outcome_signal]} />
                {opt.description && (
                  <p className="journey-option-desc">{opt.description}</p>
                )}
              </div>
            ))}
          </div>

          {node.community_note && (
            <div className="journey-community-note">
              <span className="journey-community-note-icon">💬</span>
              {node.community_note}
            </div>
          )}

          <div className="journey-step-stats">
            <span>Based on {node.source_post_count} community posts</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step card — informational, what everyone does ──
function StepCard({ node, index, isExpanded, onToggle }) {
  return (
    <div className="journey-step-card">
      <button className="journey-step-header" onClick={onToggle}>
        <div className="journey-step-number">{index + 1}</div>
        <div className="journey-step-meta">
          <div className="journey-step-title-row">
            <span className="journey-step-title">{node.title}</span>
            <span className={`journey-importance-badge importance-${node.importance}`}>
              {node.importance}
            </span>
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
              <div className="journey-options-label">How people navigated this</div>
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
      <p>We're processing community posts for {label} journeys. Check back soon.</p>
    </div>
  );
}

export default function JourneysTab() {
  const [activeType, setActiveType] = useState('egg-freezing');
  const [expandedNode, setExpandedNode] = useState(0);
  const { nodes, loading } = useJourneys(activeType);

  const activeLabel = JOURNEY_TYPES.find(t => t.id === activeType)?.label;
  const choices = nodes?.filter(n => n.is_choice) || [];
  const steps   = nodes?.filter(n => !n.is_choice) || [];

  return (
    <div className="tab-content">
      <div className="journeys-header">
        <h1><em>Journeys</em></h1>
        <p>
          Common paths people take — parsed from real community posts, classified
          into steps and decisions, with the options people actually chose at each one.
        </p>
      </div>

      <div className="view-toggle" style={{ marginBottom: 28 }}>
        {JOURNEY_TYPES.map(t => (
          <button
            key={t.id}
            className={`view-toggle-btn${activeType === t.id ? ' active' : ''}`}
            onClick={() => { setActiveType(t.id); setExpandedNode(0); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Loading...</p>
      )}

      {!loading && nodes?.length > 0 && (
        <>
          {/* Decisions section */}
          {choices.length > 0 && (
            <div className="journey-section">
              <div className="journey-section-header">
                <div className="journey-section-title">Decisions you'll face</div>
                <div className="journey-section-subtitle">
                  Real forks in the road — what women chose and why
                </div>
              </div>
              <div className="journey-steps-list">
                {choices.map((node, i) => (
                  <ChoiceCard
                    key={node.node_id ?? i}
                    node={node}
                    index={i}
                    isExpanded={expandedNode === `c${i}`}
                    onToggle={() => setExpandedNode(expandedNode === `c${i}` ? null : `c${i}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Steps section */}
          {steps.length > 0 && (
            <div className="journey-section">
              <div className="journey-section-header">
                <div className="journey-section-title">The path</div>
                <div className="journey-section-subtitle">
                  Steps nearly everyone takes, in order
                </div>
              </div>
              <div className="journey-steps-list">
                {steps.map((node, i) => (
                  <StepCard
                    key={node.node_id ?? i}
                    node={node}
                    index={i}
                    isExpanded={expandedNode === `s${i}`}
                    onToggle={() => setExpandedNode(expandedNode === `s${i}` ? null : `s${i}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && (!nodes || nodes.length === 0) && (
        <ComingSoonState label={activeLabel} />
      )}
    </div>
  );
}
