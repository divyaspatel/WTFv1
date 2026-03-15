import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const LS_KEY = 'wtf_personalization';

function loadFromLS() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); }
  catch { return null; }
}

export function usePersonalization(profile) {
  const { user } = useAuth();
  const [personalization, setPersonalization] = useState(loadFromLS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!user || !profile) return;

    // Avoid re-fetching if profile hasn't changed
    const profileKey = JSON.stringify({
      age: profile.age,
      partner_status: profile.partner_status,
      goal: profile.goal,
      journey_stage: profile.journey_stage,
      risks: profile.risks,
      had_consultation: profile.had_consultation,
      amh: profile.amh,
      afc: profile.afc,
    });

    if (profileRef.current === profileKey) return;
    profileRef.current = profileKey;

    setLoading(true);
    setError(null);

    supabase.functions
      .invoke('personalize-pathway', {})
      .then(async ({ data, error: fnError }) => {
        if (fnError) {
          console.error('Personalization error:', fnError);
          // FunctionsHttpError has a context property that is the raw Response
          let detail = fnError.message || 'Unknown error';
          try {
            if (fnError.context?.json) {
              const body = await fnError.context.json();
              detail = body.error || body.detail || JSON.stringify(body);
            } else if (fnError.context?.text) {
              detail = await fnError.context.text();
            }
          } catch (_) {}
          setError(detail);
          setLoading(false);
          return;
        }
        setPersonalization(data);
        localStorage.setItem(LS_KEY, JSON.stringify(data));
        setLoading(false);
      });
  }, [user, profile]);

  function clearPersonalization() {
    setPersonalization(null);
    localStorage.removeItem(LS_KEY);
    profileRef.current = null;
  }

  return { personalization, loading, error, clearPersonalization };
}
