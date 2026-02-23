import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginScreen from './components/LoginScreen';
import AppShell from './components/AppShell';
import DisclaimerBar from './components/DisclaimerBar';

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
