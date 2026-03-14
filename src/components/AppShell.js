import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import ProductPage from '../pages/ProductPage';

export default function AppShell() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const initial = user?.user_metadata?.full_name?.[0]?.toUpperCase()
    ?? user?.email?.[0]?.toUpperCase()
    ?? 'U';
  const name = user?.user_metadata?.full_name ?? user?.email ?? '';

  async function handleSignOut() {
    setMenuOpen(false);
    await supabase.auth.signOut();
  }

  // Close menu when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div id="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header>
        <div className="header-logo">
          WTF <span>what the fertility</span>
        </div>
        <div className="header-right">
          <div className="day-badge">🌸 Cycle Tracker</div>
          <div className="avatar-menu" ref={menuRef}>
            <div className="avatar" onClick={() => setMenuOpen(o => !o)}>{initial}</div>
            {menuOpen && (
              <div className="avatar-dropdown">
                {name && <div className="avatar-dropdown-name">{name}</div>}
                <button className="avatar-dropdown-signout" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <ProductPage />
    </div>
  );
}
