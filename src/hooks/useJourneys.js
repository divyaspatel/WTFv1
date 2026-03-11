import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useJourneys(journeyType) {
  const [nodes, setNodes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setNodes(null);
    supabase
      .from('journeys')
      .select('nodes')
      .eq('journey_type', journeyType)
      .maybeSingle()
      .then(({ data }) => {
        setNodes(data?.nodes ?? []);
        setLoading(false);
      });
  }, [journeyType]);

  return { nodes, loading };
}
