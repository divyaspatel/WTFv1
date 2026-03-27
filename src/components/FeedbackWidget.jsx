import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { MODEL_VERSION } from '../data/modelVersion';

function ThumbUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function ThumbDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
      <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  );
}

export default function FeedbackWidget({ tab, stepId, stepIndex, appVersion }) {
  const { user } = useAuth();
  const [selectedRating, setSelectedRating] = useState(null);
  const [feedbackId, setFeedbackId] = useState(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleThumb(rating) {
    if (selectedRating === rating) return; // no double-logging

    setSelectedRating(rating);
    setShowComment(true);
    setComment('');
    setDone(false);

    const { data, error } = await supabase
      .from('feedback')
      .insert({
        user_id: user?.id ?? null,
        session_id: sessionStorage.getItem('session_id'),
        rating,
        tab,
        step_id: stepId,
        step_index: stepIndex,
        app_version: appVersion ?? MODEL_VERSION ?? null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Feedback insert failed:', error);
    } else if (data) {
      setFeedbackId(data.id);
    }
  }

  async function handleSubmit() {
    if (!comment.trim()) return;
    setSubmitting(true);

    if (feedbackId) {
      await supabase
        .from('feedback')
        .update({ comment: comment.trim() })
        .eq('id', feedbackId);
    } else {
      // Fallback: thumb insert failed earlier — do a full insert now with comment
      await supabase
        .from('feedback')
        .insert({
          user_id: user?.id ?? null,
          session_id: sessionStorage.getItem('session_id'),
          rating: selectedRating,
          tab,
          step_id: stepId,
          step_index: stepIndex,
          app_version: appVersion ?? MODEL_VERSION ?? null,
          comment: comment.trim(),
          created_at: new Date().toISOString(),
        });
    }

    setSubmitting(false);
    setShowComment(false);
    setDone(true);
  }

  function handleSkip() {
    setShowComment(false);
    setDone(true);
  }

  const promptLabel = selectedRating === 1 ? "What's working?" : "What's not working?";

  return (
    <div className="feedback-widget">
      <div className="feedback-row">
        <span className="feedback-label">Was this helpful?</span>
        <div className="feedback-thumbs">
          <button
            className={`feedback-thumb-btn up${selectedRating === 1 ? ' selected' : ''}`}
            onClick={() => handleThumb(1)}
            aria-label="Thumbs up"
            title="Helpful"
          >
            <ThumbUpIcon />
          </button>
          <button
            className={`feedback-thumb-btn down${selectedRating === -1 ? ' selected' : ''}`}
            onClick={() => handleThumb(-1)}
            aria-label="Thumbs down"
            title="Not helpful"
          >
            <ThumbDownIcon />
          </button>
        </div>
        {done && <span className="feedback-thanks">Thanks!</span>}
      </div>

      <div className={`feedback-comment-box${showComment ? ' open' : ''}`}>
        <label className="feedback-comment-label">{promptLabel}</label>
        <textarea
          className="feedback-comment-input"
          placeholder="Optional — tell us more..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={2}
        />
        <div className="feedback-comment-actions">
          <button
            className="feedback-submit-btn"
            onClick={handleSubmit}
            disabled={submitting || !comment.trim()}
          >
            {submitting ? 'Saving…' : 'Submit'}
          </button>
          <button className="feedback-skip-btn" onClick={handleSkip}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
