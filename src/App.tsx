import React from 'react';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/layout/Layout';
import { LoginForm } from './components/auth/LoginForm';

function App() {
  const { user } = useAuth();

  if (!user) {
    return <LoginForm />;
  }

  return <Layout />;
}

export default App;