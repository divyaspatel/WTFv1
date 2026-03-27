import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginScreen from './components/LoginScreen';
import AppShell from './components/AppShell';
import DisclaimerBar from './components/DisclaimerBar';

if (!sessionStorage.getItem('session_id')) {
  sessionStorage.setItem('session_id', crypto.randomUUID());
}

export default function App() {
  const { user } = useAuth();

  // user === undefined means still loading session
  if (user === undefined) return null;

  return (
    <>
      {user ? <AppShell /> : <LoginScreen />}
      <DisclaimerBar />
    </>
  );
}
