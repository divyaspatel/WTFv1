import React, { useState } from 'react';
import { useJourneys } from '../../hooks/useJourneys';
import { useUserProfile } from '../../hooks/useUserProfile';
import { usePersonalization } from '../../hooks/usePersonalization';
import ProfileIntake from '../profile/ProfileIntake';

const JOURNEY_TYPES = [
  { id: 'egg-freezing',   label: 'Egg Freezing'   },
  { id: 'ivf',            label: 'IVF'            },
  { id: 'embryo-banking', label: 'Embryo Banking' },
];

const OUTCOME_COLORS = {
  positive: 'var(--sage)',
  negative: 'var(--terracotta)',
  mixed:    'var(--mauve)',
  neutral:  'var(--text-light)',
};

// ── Which canonical nodes are most relevant given the user's journey stage ──
const STAGE_FOCUS = {
  researching:       ['pre-consultation', 'diagnostics', 'consultation'],
  pre_consultation:  ['pre-consultation', 'diagnostics', 'consultation'],
  post_consultation: ['consultation', 'medication', 'admin', 'financial'],
  mid_cycle:         ['medication', 'procedure', 'diagnostics'],
  post_retrieval:    ['procedure', 'emotional'],
  transfer:          ['procedure', 'emotional'],
};

function personalizeNodes(nodes, profile) {
  if (!profile || !nodes) return { prioritized: [], rest: nodes || [] };

  const focusCategories = STAGE_FOCUS[profile.journey_stage] || [];
  const hasMalePartner = profile.partner_status === 'male_partner';

  let filtered = nodes;

  // Remove male partner testing node if no male partner
  if (!hasMalePartner) {
    filtered = filtered.filter(n =>
      !n.title?.toLowerCase().includes('male partner') &&
      !n.title?.toLowerCase().includes('partner testing')
    );
  }

  // If they've already done a retrieval, de-emphasize pre-retrieval steps
  if (['post_retrieval', 'transfer'].includes(profile.journey_stage)) {
    filtered = filtered.filter(n =>
      !['diagnostics', 'consultation'].includes(n.category) ||
      n.is_choice
    );
  }

  // Split into "relevant now" vs rest, based on journey stage
  if (focusCategories.length > 0) {
    const prioritized = filtered.filter(n => focusCategories.includes(n.category));
    const rest = filtered.filter(n => !focusCategories.includes(n.category));
    return { prioritized, rest };
  }

  return { prioritized: [], rest: filtered };
}

function stageLabel(stage) {
  const labels = {
    researching:       'just starting to research',
    pre_consultation:  'pre-consultation',
    post_consultation: 'post-consultation',
    mid_cycle:         'mid-cycle',
    post_retrieval:    'post-retrieval',
    transfer:          'preparing for transfer',
  };
  return labels[stage] || stage;
}

// ── Shared subcomponents ──

function FrequencyBar({ frequency, color }) {
  return (
    <div className="journey-freq-bar-wrap">
      <div className="journey-freq-bar-track">
        <div
          className="journey-freq-bar-fill"
          style={{ width: `${(frequency || 0) * 100}%`, background: color || 'var(--terracotta)' }}
        />
      </div>
      <span className="journey-freq-label">{Math.round((frequency || 0) * 100)}%</span>
    </div>
  );
}

function PersonalizedNote({ note }) {
  if (!note) return null;
  return (
    <div className="journey-personalized-note">
      <span className="journey-personalized-note-icon">✦</span>
      {note}
    </div>
  );
}

function ChoiceCard({ node, isExpanded, onToggle, personalizedNote, recommendation }) {
  return (
    <div className="journey-choice-card">
      <button className="journey-choice-header" onClick={onToggle}>
        <div className="journey-choice-badge">Decision</div>
        <div className="journey-choice-meta">
          <div className="journey-choice-question">{node.choice_question}</div>
          <div className="journey-choice-subtitle">
            {Math.round((node.frequency || 0) * 100)}% of journeys faced this
            {node.decision_point_count > 0 && ` · ${node.decision_point_count} explicit accounts`}
          </div>
        </div>
        <div className={`journey-step-chevron${isExpanded ? ' open' : ''}`}>›</div>
      </button>

      {isExpanded && (
        <div className="journey-choice-body">
          {node.description && <p className="journey-step-description">{node.description}</p>}

          <PersonalizedNote note={personalizedNote} />

          {recommendation && (
            <div className="journey-recommendation">
              <div className="journey-recommendation-label">Based on your profile</div>
              <div className="journey-recommendation-option">{recommendation.recommended_option}</div>
              <p className="journey-recommendation-reasoning">{recommendation.reasoning}</p>
              <div className="journey-recommendation-confidence">
                {Math.round((recommendation.confidence || 0) * 100)}% confidence based on community data
              </div>
            </div>
          )}

          <div className="journey-choice-options-label">What women chose</div>
          <div className="journey-choice-options">
            {node.options?.map((opt, i) => (
              <div key={i} className="journey-choice-option">
                <div className="journey-choice-option-top">
                  <span className="journey-choice-option-label" style={{ color: OUTCOME_COLORS[opt.outcome_signal] }}>
                    {opt.label}
                  </span>
                  <span className="journey-option-freq">{Math.round((opt.frequency || 0) * 100)}%</span>
                </div>
                <FrequencyBar frequency={opt.frequency} color={OUTCOME_COLORS[opt.outcome_signal]} />
                {opt.description && <p className="journey-option-desc">{opt.description}</p>}
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

function StepCard({ node, index, isExpanded, onToggle, personalizedNote }) {
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

          <PersonalizedNote note={personalizedNote} />

          {node.options?.length > 0 && (
            <div className="journey-options-section">
              <div className="journey-options-label">How people navigated this</div>
              {node.options.map((opt, i) => (
                <div key={i} className="journey-option-row">
                  <div className="journey-option-dot" style={{ borderColor: OUTCOME_COLORS[opt.outcome_signal] }} />
                  <div className="journey-option-content">
                    <span className="journey-option-label">{opt.label}</span>
                    {opt.description && <span className="journey-option-desc">{opt.description}</span>}
                  </div>
                  <span className="journey-option-freq">{Math.round((opt.frequency || 0) * 100)}%</span>
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

function NodeCard({ node, index, isExpanded, onToggle, personalizedNote, recommendation }) {
  if (node.is_choice) return (
    <ChoiceCard
      node={node}
      isExpanded={isExpanded}
      onToggle={onToggle}
      personalizedNote={personalizedNote}
      recommendation={recommendation}
    />
  );
  return (
    <StepCard
      node={node}
      index={index}
      isExpanded={isExpanded}
      onToggle={onToggle}
      personalizedNote={personalizedNote}
    />
  );
}

function ProfileBanner({ profile, onReset }) {
  return (
    <div className="intake-profile-banner">
      <div className="intake-profile-banner-text">
        Showing pathway for <strong>age {profile.age}</strong>
        {profile.location && <>, {profile.location}</>}
        {' · '}{stageLabel(profile.journey_stage)}
      </div>
      <button className="intake-profile-reset" onClick={onReset}>Update</button>
    </div>
  );
}

function PersonalizationSummary({ personalization }) {
  if (!personalization) return null;
  return (
    <div className="journey-personalization-summary">
      <div className="journey-personalization-headline">{personalization.headline}</div>
      <p className="journey-personalization-text">{personalization.summary}</p>

      {personalization.next_step && (
        <div className="journey-next-step">
          <div className="journey-next-step-label">Your next step</div>
          <div className="journey-next-step-text">{personalization.next_step}</div>
        </div>
      )}

      {personalization.watch_outs?.length > 0 && (
        <div className="journey-watchouts">
          <div className="journey-watchouts-label">Watch out for</div>
          <ul className="journey-watchouts-list">
            {personalization.watch_outs.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {personalization.questions_for_re?.length > 0 && (
        <div className="journey-questions">
          <div className="journey-questions-label">Questions to ask your RE</div>
          <ul className="journey-questions-list">
            {personalization.questions_for_re.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {personalization.confidence != null && (
        <div className="journey-confidence">
          <span className="journey-confidence-note">{personalization.confidence_note}</span>
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

// ── Main tab ──

export default function JourneysTab() {
  const [activeType, setActiveType] = useState('egg-freezing');
  const [expandedNode, setExpandedNode] = useState(null);
  const [showingIntake, setShowingIntake] = useState(false);

  const { nodes, loading: journeysLoading } = useJourneys(activeType);
  const { profile, saveProfile, clearProfile, loading: profileLoading } = useUserProfile();
  const { personalization, loading: personalizationLoading, error } = usePersonalization(profile);

  const activeLabel = JOURNEY_TYPES.find(t => t.id === activeType)?.label;

  async function handleIntakeComplete(fields) {
    await saveProfile(fields);
    setShowingIntake(false);
  }

  // Show intake if no profile yet or explicitly triggered
  if (!profileLoading && (!profile || showingIntake)) {
    return (
      <ProfileIntake onComplete={handleIntakeComplete} />
    );
  }

  const { prioritized, rest } = personalizeNodes(nodes, profile);
  const choices = rest.filter(n => n.is_choice);
  const steps   = rest.filter(n => !n.is_choice);

  // Index node notes and recommendations by node_id
  const nodeNotes = personalization?.node_notes || {};
  const choiceRecs = personalization?.choice_recommendations || {};

  function getNodeKey(node) {
    return node.node_id != null ? String(node.node_id) : null;
  }

  return (
    <div className="tab-content">
      <div className="journeys-header">
        <h1><em>Journeys</em></h1>
        <p>
          Common paths people take — parsed from real community posts, classified
          into steps and decisions, with the options people actually chose at each one.
        </p>
      </div>

      {profile && (
        <ProfileBanner
          profile={profile}
          onReset={() => { clearProfile(); setShowingIntake(false); }}
        />
      )}

      <div className="view-toggle" style={{ marginBottom: 28 }}>
        {JOURNEY_TYPES.map(t => (
          <button
            key={t.id}
            className={`view-toggle-btn${activeType === t.id ? ' active' : ''}`}
            onClick={() => { setActiveType(t.id); setExpandedNode(null); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Personalized summary card */}
      {personalizationLoading && (
        <p style={{ color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 20 }}>
          Personalizing your pathway…
        </p>
      )}
      {!personalizationLoading && error && (
        <p style={{ color: 'var(--terracotta)', fontSize: 13, marginBottom: 20 }}>
          Personalization unavailable: {error}
        </p>
      )}
      {!personalizationLoading && personalization && (
        <PersonalizationSummary personalization={personalization} />
      )}

      {journeysLoading && (
        <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Loading...</p>
      )}

      {!journeysLoading && nodes?.length > 0 && (
        <>
          {/* Relevant now — personalized section */}
          {prioritized.length > 0 && (
            <div className="journey-section">
              <div className="journey-section-header">
                <div className="journey-section-title">Relevant for you now</div>
                <div className="journey-section-subtitle">
                  Based on where you are — {stageLabel(profile?.journey_stage)}
                </div>
              </div>
              <div className="journey-steps-list">
                {prioritized.map((node, i) => (
                  <NodeCard
                    key={node.node_id ?? i}
                    node={node}
                    index={i}
                    isExpanded={expandedNode === `p${i}`}
                    onToggle={() => setExpandedNode(expandedNode === `p${i}` ? null : `p${i}`)}
                    personalizedNote={getNodeKey(node) ? nodeNotes[getNodeKey(node)] : null}
                    recommendation={getNodeKey(node) ? choiceRecs[getNodeKey(node)] : null}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Choices */}
          {choices.length > 0 && (
            <div className="journey-section">
              <div className="journey-section-header">
                <div className="journey-section-title">Decisions you'll face</div>
                <div className="journey-section-subtitle">Real forks in the road — what women chose and why</div>
              </div>
              <div className="journey-steps-list">
                {choices.map((node, i) => (
                  <NodeCard
                    key={node.node_id ?? i}
                    node={node}
                    index={i}
                    isExpanded={expandedNode === `c${i}`}
                    onToggle={() => setExpandedNode(expandedNode === `c${i}` ? null : `c${i}`)}
                    personalizedNote={getNodeKey(node) ? nodeNotes[getNodeKey(node)] : null}
                    recommendation={getNodeKey(node) ? choiceRecs[getNodeKey(node)] : null}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Steps */}
          {steps.length > 0 && (
            <div className="journey-section">
              <div className="journey-section-header">
                <div className="journey-section-title">The path</div>
                <div className="journey-section-subtitle">Steps nearly everyone takes, in order</div>
              </div>
              <div className="journey-steps-list">
                {steps.map((node, i) => (
                  <NodeCard
                    key={node.node_id ?? i}
                    node={node}
                    index={i}
                    isExpanded={expandedNode === `s${i}`}
                    onToggle={() => setExpandedNode(expandedNode === `s${i}` ? null : `s${i}`)}
                    personalizedNote={getNodeKey(node) ? nodeNotes[getNodeKey(node)] : null}
                    recommendation={null}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!journeysLoading && (!nodes || nodes.length === 0) && (
        <ComingSoonState label={activeLabel} />
      )}
    </div>
  );
}
