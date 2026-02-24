import { useState } from 'react';

const KEY = 'wtf_protocol';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null') || []; }
  catch { return []; }
}

export function useProtocol() {
  const [protocol, setProtocol] = useState(load);

  function saveProtocol(meds) {
    setProtocol(meds);
    localStorage.setItem(KEY, JSON.stringify(meds));
  }

  function clearProtocol() {
    setProtocol([]);
    localStorage.removeItem(KEY);
  }

  return { protocol, saveProtocol, clearProtocol };
}
