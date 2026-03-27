import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useDayInsights(cycleDay) {
  const [cards, setCards] = useState(null);
  const [modelVersion, setModelVersion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setCards(null);
    setModelVersion(null);
    supabase
      .from('day_insights')
      .select('cards, model_version')
      .eq('cycle_day', cycleDay)
      .maybeSingle()
      .then(({ data }) => {
        setCards(data?.cards ?? []);
        setModelVersion(data?.model_version ?? null);
        setLoading(false);
      });
  }, [cycleDay]);

  return { cards, modelVersion, loading };
}
