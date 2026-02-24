import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useDayInsights(cycleDay) {
  const [cards, setCards] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setCards(null);
    supabase
      .from('day_insights')
      .select('cards')
      .eq('cycle_day', cycleDay)
      .maybeSingle()
      .then(({ data }) => {
        setCards(data?.cards ?? []);
        setLoading(false);
      });
  }, [cycleDay]);

  return { cards, loading };
}
