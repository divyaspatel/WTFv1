import React, { useState, useEffect, useRef } from 'react';
import { useJourneys } from '../../hooks/useJourneys';
import { useUserProfile } from '../../hooks/useUserProfile';
import ProfileIntake from '../profile/ProfileIntake';

const OUTCOME_COLORS = {
  positive: 'var(--sage)',
  negative: 'var(--terracotta)',
  mixed:    'var(--mauve)',
  neutral:  'var(--text-light)',
};

const PHASE_CONFIG = [
  { id: 'preparation',   label: 'Prep',          nodeIds: [1, 2, 3]    },
  { id: 'meds',          label: 'Meds',          nodeIds: [4, 5]       },
  { id: 'egg_retrieval', label: 'Retrieval',     nodeIds: [6]          },
  { id: 'embryo_making', label: 'Embryo Making', nodeIds: [7, 8]       },
  { id: 'pgta_testing',  label: 'PGT-A',         nodeIds: [9]          },
  { id: 'next_steps',    label: 'Next Steps',    nodeIds: [10, 11, 12, 13] },
];

const STAGE_TO_CURRENT_NODE = {
  researching:       1,
  pre_consultation:  2,
  post_consultation: 3,
  mid_cycle:         4,
  post_retrieval:    7,
  transfer:          10,
};

function filterNodes(nodes, profile) {
  if (!nodes) return [];
  if (!profile) return nodes;
  let filtered = [...nodes];
  if (profile.partner_status !== 'male_partner') {
    filtered = filtered.filter(n =>
      !n.title?.toLowerCase().includes('male partner') &&
      !n.title?.toLowerCase().includes('partner testing')
    );
  }
  return filtered;
}

// ── Node Navigation — phase segments with one circle per node ──

const PHASE_COLORS = [
  '#FEF2EC', // Prep      — light terracotta
  '#EFF6F2', // Meds      — light sage
  '#F5F1FB', // Retrieval — light lavender
  '#EFF6F2', // Embryo    — light sage
  '#FDF8EE', // PGT-A     — light amber
  '#F9F0F5', // Next Steps — light mauve
];

function NodeNav({ nodes, currentNodeId, selectedNodeId, onSelect }) {
  const sorted = [...nodes].sort((a, b) => (a.node_id || 0) - (b.node_id || 0));

  const phases = PHASE_CONFIG
    .map(phase => ({
      ...phase,
      nodes: phase.nodeIds.map(id => sorted.find(n => n.node_id === id)).filter(Boolean),
    }))
    .filter(p => p.nodes.length > 0);

  return (
    <div className="node-nav-wrapper">
      {/* Phase labels above */}
      <div className="node-nav-labels">
        {phases.map((phase, i) => (
          <div
            key={phase.id}
            className="node-nav-phase-label"
            style={{ flex: phase.nodes.length }}
          >
            {phase.label}
          </div>
        ))}
      </div>

      {/* Phase segments with circles */}
      <div className="node-nav-track">
        {phases.map((phase, phaseIdx) => (
          <div
            key={phase.id}
            className="node-nav-seg"
            style={{
              flex: phase.nodes.length,
              background: PHASE_COLORS[phaseIdx % PHASE_COLORS.length],
              justifyContent: phase.nodes.length === 1 ? 'center' : 'flex-start',
            }}
          >
            {phase.nodes.map((node, nodeIdx) => {
              const isPast    = currentNodeId != null && node.node_id < currentNodeId;
              const isCurrent = node.node_id === currentNodeId;
              const isSelected = node.node_id === selectedNodeId;

              return (
                <React.Fragment key={node.node_id}>
                  {nodeIdx > 0 && (
                    <div className={`node-nav-line${isPast ? ' done' : ''}`} />
                  )}
                  <div className="node-dot-wrap">
                    <button
                      className={`node-nav-dot${isPast ? ' past' : ''}${isCurrent ? ' current' : ''}${isSelected ? ' selected' : ''}`}
                      onClick={() => onSelect(node)}
                      aria-label={node.title}
                      title={node.title}
                    />
                    {isCurrent && (
                      <div className="node-you-are-here">You are here</div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Collapsible Choices ──

function CollapsibleChoices({ node }) {
  const [open, setOpen] = useState(false);

  const hasOptions = node.options?.length > 0;
  const hasCommunity = !!node.community_note;
  if (!hasOptions && !hasCommunity) return null;

  return (
    <div className="choices-section">
      <button className="choices-toggle" onClick={() => setOpen(o => !o)}>
        {open ? '↑' : '↓'} See what women chose + questions to ask your RE {open ? '↑' : '↓'}
      </button>

      {open && (
        <div className="choices-body">
          {hasOptions && (
            <div className="choices-options">
              <div className="choices-options-label">
                {node.is_choice ? 'What women chose' : 'How people navigated this'}
              </div>
              {node.options.map((opt, i) => (
                <div key={i} className="choice-option-row">
                  <div className="choice-option-top">
                    <span className="choice-option-label" style={{ color: OUTCOME_COLORS[opt.outcome_signal] }}>
                      {opt.label}
                    </span>
                    <span className="choice-option-pct">
                      {Math.round((opt.frequency || 0) * 100)}%
                    </span>
                  </div>
                  <div className="choice-option-bar-track">
                    <div
                      className="choice-option-bar-fill"
                      style={{
                        width: `${(opt.frequency || 0) * 100}%`,
                        background: OUTCOME_COLORS[opt.outcome_signal] || 'var(--terracotta)',
                      }}
                    />
                  </div>
                  {opt.description && (
                    <p className="choice-option-desc">{opt.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {hasCommunity && (
            <div className="community-note">
              <span className="community-note-icon">💬</span>
              {node.community_note}
            </div>
          )}

          {node.source_post_count > 0 && (
            <div className="source-count">
              Based on {node.source_post_count} community posts
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Ask a Question (streaming) ──

const FOLLOW_UP_CHIPS = [
  'What should I ask my RE?',
  'What did others find most helpful?',
  'How long does this take?',
  'What should I watch out for?',
];

function AskQuestion({ node }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const answerRef = useRef(null);

  async function handleAsk(q) {
    const userQ = q || question;
    if (!userQ.trim() || isStreaming) return;

    setAnswer('');
    setShowChips(false);
    setIsStreaming(true);
    setQuestion('');

    const systemPrompt = `You are a warm, knowledgeable friend helping someone navigate egg freezing. Keep answers concise (2-4 sentences), conversational, and supportive. Never be clinical or scary.

Current step the user is asking about:
Title: ${node.title}
Description: ${node.description || ''}
${node.community_note ? `Community insight: ${node.community_note}` : ''}

If you don't know something, say so and suggest they ask their RE.`;

    try {
      const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
      if (!apiKey) {
        setAnswer("Q&A isn't configured yet — ask your RE directly about this one!");
        setIsStreaming(false);
        return;
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          stream: true,
          system: systemPrompt,
          messages: [{ role: 'user', content: userQ }],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]' || !data) continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              setAnswer(prev => prev + parsed.delta.text);
              if (answerRef.current) {
                answerRef.current.scrollTop = answerRef.current.scrollHeight;
              }
            }
          } catch { /* skip malformed lines */ }
        }
      }

      setShowChips(true);
    } catch (err) {
      setAnswer("Something went wrong — try asking your RE directly about this one.");
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="ask-section">
      <div className="ask-row">
        <input
          className="ask-input"
          type="text"
          placeholder="Have a question about this step?"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          disabled={isStreaming}
        />
        <button
          className="ask-btn"
          onClick={() => handleAsk()}
          disabled={!question.trim() || isStreaming}
        >
          {isStreaming ? '…' : 'Ask →'}
        </button>
      </div>

      {(answer || isStreaming) && (
        <div className="ask-answer" ref={answerRef}>
          {answer}
          {isStreaming && <span className="ask-cursor" />}
        </div>
      )}

      {showChips && (
        <div className="ask-chips">
          {FOLLOW_UP_CHIPS.map(chip => (
            <button
              key={chip}
              className="ask-chip"
              onClick={() => handleAsk(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Node Detail Card ──

function NodeDetailCard({ node, isCurrentNode, onMarkComplete, isCompleted }) {
  if (!node) return null;

  return (
    <div className="node-detail-card">
      <div className="node-detail-top">
        {isCurrentNode && (
          <div className="you-are-here-badge">YOU ARE HERE</div>
        )}
        <div className={`node-importance-badge importance-${node.importance}`}>
          {node.is_choice ? 'Decision Point' : node.importance}
        </div>
      </div>

      <h2 className="node-detail-title">
        {node.is_choice && node.choice_question ? node.choice_question : node.title}
      </h2>

      {node.description && (
        <p className="node-detail-description">{node.description}</p>
      )}

      <CollapsibleChoices node={node} />

      <AskQuestion node={node} />

      <p className="ask-disclaimer">
        For informational purposes only — always confirm with your RE before making medical decisions.
      </p>

      <label className="mark-complete-row">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={e => onMarkComplete(node.node_id, e.target.checked)}
        />
        <span>Mark this step as complete</span>
      </label>
    </div>
  );
}

// ── Main Tab ──

export default function JourneysTab() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [completedNodes, setCompletedNodes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wtf_completed_nodes') || '[]'); }
    catch { return []; }
  });
  const [showingIntake, setShowingIntake] = useState(false);

  const { nodes, loading: journeysLoading } = useJourneys('egg-freezing');
  const { profile, saveProfile, loading: profileLoading } = useUserProfile();

  const filteredNodes = filterNodes(nodes, profile);
  const currentNodeId = STAGE_TO_CURRENT_NODE[profile?.journey_stage] ?? null;

  // Auto-select current node on load
  useEffect(() => {
    if (!filteredNodes?.length || !profile?.journey_stage) return;
    const currentId = STAGE_TO_CURRENT_NODE[profile.journey_stage];
    const currentNode = filteredNodes.find(n => n.node_id === currentId) ?? filteredNodes[0];
    if (currentNode) setSelectedNode(currentNode);
  }, [nodes, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleMarkComplete(nodeId, checked) {
    const updated = checked
      ? [...new Set([...completedNodes, nodeId])]
      : completedNodes.filter(id => id !== nodeId);
    setCompletedNodes(updated);
    localStorage.setItem('wtf_completed_nodes', JSON.stringify(updated));
  }

  async function handleIntakeComplete(fields) {
    await saveProfile(fields);
    setShowingIntake(false);
  }

  if (!profileLoading && (!profile || showingIntake)) {
    return <ProfileIntake initialValues={profile} onComplete={handleIntakeComplete} />;
  }

  const isCurrentNode = selectedNode?.node_id === currentNodeId;
  const isCompleted = completedNodes.includes(selectedNode?.node_id);

  return (
    <div className="tab-content">
      <div className="journeys-header">
        <h1><em>Egg Freezing Pathways</em></h1>
        <p>
          Common paths real women took — from community posts, distilled into steps and decisions you'll actually face.
        </p>
      </div>

      <button
        className="intake-profile-reset"
        style={{ marginBottom: 24 }}
        onClick={() => { setShowingIntake(true); setSelectedNode(null); }}
      >
        Update my profile
      </button>

      {journeysLoading && (
        <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Loading pathway…</p>
      )}

      {!journeysLoading && filteredNodes?.length > 0 && (
        <>
          <NodeNav
            nodes={filteredNodes}
            currentNodeId={currentNodeId}
            selectedNodeId={selectedNode?.node_id}
            onSelect={setSelectedNode}
          />

          <NodeDetailCard
            node={selectedNode}
            isCurrentNode={isCurrentNode}
            onMarkComplete={handleMarkComplete}
            isCompleted={isCompleted}
          />
        </>
      )}

      {!journeysLoading && (!filteredNodes || filteredNodes.length === 0) && (
        <div className="journey-coming-soon">
          <div className="journey-coming-soon-icon">⚙️</div>
          <h3>Coming soon</h3>
          <p>We're processing community posts for this pathway. Check back soon.</p>
        </div>
      )}
    </div>
  );
}
