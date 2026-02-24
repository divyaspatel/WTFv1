import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const LS_KEY = 'wtf_protocol';

function loadFromLS() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') || []; }
  catch { return []; }
}

export function useProtocol() {
  const { user } = useAuth();
  const [protocol, setProtocol] = useState(loadFromLS); // instant init from LS cache
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from('protocols')
      .select('medications')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.medications) {
          setProtocol(data.medications);
          localStorage.setItem(LS_KEY, JSON.stringify(data.medications));
        }
        setLoading(false);
      });
  }, [user]);

  async function saveProtocol(meds) {
    setProtocol(meds);
    localStorage.setItem(LS_KEY, JSON.stringify(meds));
    if (!user) return;
    await supabase.from('protocols').upsert(
      { user_id: user.id, medications: meds, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  }

  return { protocol, saveProtocol, loading };
}
