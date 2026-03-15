import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const LS_KEY = 'wtf_profile';

function loadFromLS() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); }
  catch { return null; }
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(loadFromLS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          localStorage.setItem(LS_KEY, JSON.stringify(data));
        }
        setLoading(false);
      });
  }, [user]);

  async function saveProfile(fields) {
    const updated = { ...profile, ...fields };
    setProfile(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    if (!user) return;
    await supabase.from('user_profiles').upsert(
      { user_id: user.id, ...fields, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  }

  async function clearProfile() {
    setProfile(null);
    localStorage.removeItem(LS_KEY);
    if (!user) return;
    await supabase.from('user_profiles').delete().eq('user_id', user.id);
  }

  return { profile, saveProfile, clearProfile, loading };
}
