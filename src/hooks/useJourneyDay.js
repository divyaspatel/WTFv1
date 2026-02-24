import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const LOG_KEY = day => `wtf_log_day_${day}`;

function loadFromLS(day) {
  try { return JSON.parse(localStorage.getItem(LOG_KEY(day)) || 'null') || {}; }
  catch { return {}; }
}

export function useJourneyDay(selectedDay) {
  const { user } = useAuth();
  const [feel, setFeel] = useState(null);
  const [notes, setNotes] = useState('');
  const [medInputs, setMedInputs] = useState({});
  const [monitoringInputs, setMonitoringInputs] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Instantly show cached data while Supabase loads
    const cached = loadFromLS(selectedDay);
    setFeel(cached.feel || null);
    setNotes(cached.notes || '');
    setMedInputs(cached.meds || {});
    setMonitoringInputs(cached.monitoring || {});

    if (!user) return;

    setLoading(true);
    Promise.all([
      supabase.from('journal_entries')
        .select('mood, notes')
        .eq('user_id', user.id)
        .eq('cycle_day', selectedDay)
        .maybeSingle(),
      supabase.from('med_logs')
        .select('med_name, dose, time_taken')
        .eq('user_id', user.id)
        .eq('cycle_day', selectedDay),
      supabase.from('monitoring_logs')
        .select('e2, lh, p4, follicle_count')
        .eq('user_id', user.id)
        .eq('cycle_day', selectedDay)
        .maybeSingle(),
    ]).then(([journal, meds, monitoring]) => {
      if (journal.data) {
        setFeel(journal.data.mood || null);
        setNotes(journal.data.notes || '');
      }
      if (meds.data?.length) {
        const medMap = {};
        meds.data.forEach(row => {
          medMap[row.med_name] = { dose: row.dose || '', time: row.time_taken || '' };
        });
        setMedInputs(medMap);
      }
      if (monitoring.data) {
        setMonitoringInputs({
          e2:        monitoring.data.e2?.toString()            || '',
          lh:        monitoring.data.lh?.toString()            || '',
          p4:        monitoring.data.p4?.toString()            || '',
          follicles: monitoring.data.follicle_count?.toString() || '',
        });
      }
      setLoading(false);
    });
  }, [selectedDay, user]);

  async function saveDay({ feel, notes, medInputs, monitoringInputs, hadUltrasound, protocol }) {
    // Cache to localStorage immediately
    localStorage.setItem(LOG_KEY(selectedDay), JSON.stringify({
      feel, notes,
      meds: medInputs,
      monitoring: hadUltrasound ? monitoringInputs : {},
    }));

    if (!user) return;

    const saves = [
      supabase.from('journal_entries').upsert(
        { user_id: user.id, cycle_day: selectedDay, mood: feel, notes },
        { onConflict: 'user_id,cycle_day' }
      ),
      ...protocol.map(({ name }) =>
        supabase.from('med_logs').upsert(
          {
            user_id: user.id,
            cycle_day: selectedDay,
            med_name: name,
            dose: medInputs[name]?.dose || null,
            time_taken: medInputs[name]?.time || null,
          },
          { onConflict: 'user_id,cycle_day,med_name' }
        )
      ),
    ];

    if (hadUltrasound) {
      saves.push(
        supabase.from('monitoring_logs').upsert(
          {
            user_id: user.id,
            cycle_day: selectedDay,
            e2:            monitoringInputs.e2        ? parseFloat(monitoringInputs.e2)        : null,
            lh:            monitoringInputs.lh        ? parseFloat(monitoringInputs.lh)        : null,
            p4:            monitoringInputs.p4        ? parseFloat(monitoringInputs.p4)        : null,
            follicle_count: monitoringInputs.follicles ? parseInt(monitoringInputs.follicles)   : null,
          },
          { onConflict: 'user_id,cycle_day' }
        )
      );
    }

    const results = await Promise.all(saves);
    results.forEach(r => { if (r?.error) throw new Error(r.error.message); });
  }

  return { feel, setFeel, notes, setNotes, medInputs, setMedInputs, monitoringInputs, setMonitoringInputs, loading, saveDay };
}
