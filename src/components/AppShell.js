import React from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import ProductPage from '../pages/ProductPage';

export default function AppShell() {
  const { user } = useAuth();

  const initial = user?.user_metadata?.full_name?.[0]?.toUpperCase()
    ?? user?.email?.[0]?.toUpperCase()
    ?? 'U';

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <div id="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header>
        <div className="header-logo">
          WTF <span>what the fertility</span>
        </div>
        <div className="header-right">
          <div className="day-badge">🌸 Cycle Tracker</div>
          <div
            className="avatar"
            title="Sign out"
            onClick={handleSignOut}
          >
            {initial}
          </div>
        </div>
      </header>

      <ProductPage />
    </div>
  );
}
